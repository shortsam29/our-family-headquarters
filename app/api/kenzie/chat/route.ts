import { z } from "zod";
import { resolveCurrentHouseholdContext } from "@/lib/auth/context";
import { takeKenzieChatRateLimit } from "@/lib/ai/rate-limit";
import { generateKenzieReply } from "@/lib/kenzie/conversation/service";
import {
  executeKenzieProposal,
  handleImmediateKenzieAction,
  kenzieActionProposalSchema,
} from "@/lib/kenzie/platform/live-actions";
import { detectMemoryCommand } from "@/lib/kenzie/memory/commands";
import { extractDirectMemoryCandidates } from "@/lib/kenzie/memory/extract";
import {
  deleteAllOwnedMemories,
  deleteOwnedMemory,
  forgetMatchingMemory,
  listActiveMemories,
  saveMemoryCandidate,
  setMemorySettings,
} from "@/lib/kenzie/memory/service";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});
const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z.array(messageSchema).max(12).default([]),
  confirmedAction: kenzieActionProposalSchema.optional(),
  confirmedMemoryAction: z.object({ kind: z.literal("delete_all_memories") }).optional(),
  undoMemoryId: z.uuid().optional(),
  conversationId: z.uuid().optional(),
  messageId: z.uuid().optional(),
  preventMemory: z.boolean().default(false),
  conversationMemoryDisabled: z.boolean().default(false),
}).strict();
const json = (body: Record<string, unknown>, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  const context = await resolveCurrentHouseholdContext();
  if (!context || context.source !== "supabase") {
    return json({ ok: false, message: "Please sign in to talk with Kenzie." }, 401);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "That message could not be read." }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, message: "Please check the request and try again." }, 400);
  }
  const limit = takeKenzieChatRateLimit(context.userId);
  if (!limit.allowed) {
    return json({ ok: false, message: "Kenzie needs a short pause before the next message." }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }
  if (parsed.data.confirmedMemoryAction) {
    const deleted = await deleteAllOwnedMemories(context);
    return json({ ok: deleted, status: deleted ? "completed" : "failed", message: deleted ? "I forgot all of your saved personal memories. Automatic memory settings were not changed." : "I could not delete your memories. Please try again." }, deleted ? 200 : 500);
  }
  if (parsed.data.undoMemoryId) {
    const deleted = await deleteOwnedMemory(context, parsed.data.undoMemoryId);
    return json({
      ok: deleted,
      status: deleted ? "completed" : "failed",
      message: deleted
        ? "Done — I removed that memory."
        : "I could not remove that memory. You can review it in Settings.",
    }, deleted ? 200 : 500);
  }
  const memoryCommand = detectMemoryCommand(parsed.data.message);
  if (memoryCommand) {
    if (memoryCommand.kind === "list") {
      const memories = await listActiveMemories(context);
      return json({ ok: true, status: "completed", message: memories.length ? `Here is what I currently remember:\n${memories.slice(0, 12).map((memory) => `• ${memory.displayText}`).join("\n")}` : "I do not have any active personal memories saved for you." }, 200);
    }
    if (memoryCommand.kind === "pause" || memoryCommand.kind === "resume") {
      const enabled = memoryCommand.kind === "resume";
      const saved = await setMemorySettings(context, { enabled });
      return json({ ok: saved, status: saved ? "completed" : "failed", message: saved ? (enabled ? "Automatic memory is on again." : "Automatic memory is paused. Your existing memories were not deleted.") : "I could not change your memory setting." }, saved ? 200 : 500);
    }
    if (memoryCommand.kind === "forget_all") {
      return json({ ok: true, status: "proposal", message: "Delete all of your personal memories? This cannot be undone.", proposal: { kind: "delete_all_memories" } }, 200);
    }
    if (memoryCommand.kind === "forget_one") {
      const result = await forgetMatchingMemory(context, memoryCommand.search);
      const message = result.deleted ? "I forgot that personal memory." : result.count > 1 ? "I found more than one matching memory. Please be more specific." : "I could not find a matching active memory.";
      return json({ ok: true, status: result.deleted ? "completed" : "clarification", message }, 200);
    }
    return json({
      ok: true,
      status: "completed",
      message: memoryCommand.kind === "pause_conversation" ? "I will not save anything from this conversation." : "I will not save this message as a personal memory.",
      conversationMemoryPaused: memoryCommand.kind === "pause_conversation",
    }, 200);
  }
  const actionResult = parsed.data.confirmedAction
    ? await executeKenzieProposal(context, parsed.data.confirmedAction)
    : await handleImmediateKenzieAction(context, parsed.data.message);
  if (actionResult) {
    return json(
      { ok: actionResult.status !== "failed", ...actionResult },
      actionResult.status === "failed" ? 403 : 200,
    );
  }
  const result = await generateKenzieReply(context, {
    message: parsed.data.message,
    history: parsed.data.history,
  });
  let memoryNotice: { id: string; displayText: string } | undefined;
  if (
    result.ok
    && parsed.data.conversationId
    && parsed.data.messageId
    && !parsed.data.preventMemory
    && !parsed.data.conversationMemoryDisabled
  ) {
    const candidates = extractDirectMemoryCandidates(parsed.data.message, context.role);
    if (candidates.length) {
      try {
        for (const candidate of candidates) {
          const saved = await saveMemoryCandidate(context, candidate, {
            conversationId: parsed.data.conversationId,
            messageId: parsed.data.messageId,
          });
          if (saved && !memoryNotice) {
            memoryNotice = { id: saved.id, displayText: saved.displayText };
          }
        }
      } catch (error) {
        console.error("Kenzie memory extraction failed", {
          name: error instanceof Error ? error.name : "UnknownError",
        });
      }
    }
  }
  return json(memoryNotice ? { ...result, memoryNotice } : result, result.ok ? 200 : 502);
}
