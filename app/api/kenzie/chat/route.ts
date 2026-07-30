import { z } from "zod";
import { resolveCurrentHouseholdContext } from "@/lib/auth/context";
import { takeKenzieChatRateLimit } from "@/lib/ai/rate-limit";
import { generateKenzieReply } from "@/lib/kenzie/conversation/service";
import {
  executeKenzieProposal,
  handleImmediateKenzieAction,
  kenzieActionProposalSchema,
} from "@/lib/kenzie/platform/live-actions";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});
const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z.array(messageSchema).max(12).default([]),
  confirmedAction: kenzieActionProposalSchema.optional(),
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
  const actionResult = parsed.data.confirmedAction
    ? await executeKenzieProposal(context, parsed.data.confirmedAction)
    : await handleImmediateKenzieAction(context, parsed.data.message);
  if (actionResult) {
    return json(
      { ok: actionResult.status !== "failed", ...actionResult },
      actionResult.status === "failed" ? 403 : 200,
    );
  }
  const result = await generateKenzieReply(context, parsed.data);
  return json(result, result.ok ? 200 : 502);
}
