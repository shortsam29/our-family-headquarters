import { z } from "zod";
import { resolveCurrentHouseholdContext } from "@/lib/auth/context";
import { extractDirectMemoryCandidates } from "@/lib/kenzie/memory/extract";
import { saveMemoryCandidate } from "@/lib/kenzie/memory/service";

export const runtime = "nodejs";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.uuid(),
  messageId: z.uuid(),
}).strict();

const json = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const context = await resolveCurrentHouseholdContext();
  if (!context || context.source !== "supabase") {
    return json({ ok: false }, 401);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false }, 400);

  try {
    const candidates = extractDirectMemoryCandidates(parsed.data.message, context.role);
    let memoryNotice: { id: string; displayText: string } | undefined;
    for (const candidate of candidates) {
      const saved = await saveMemoryCandidate(context, candidate, {
        conversationId: parsed.data.conversationId,
        messageId: parsed.data.messageId,
      });
      if (saved && !memoryNotice) {
        memoryNotice = { id: saved.id, displayText: saved.displayText };
      }
    }
    return json({ ok: true, memoryNotice }, 200);
  } catch (error) {
    console.error("Kenzie memory extraction failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ ok: false }, 503);
  }
}
