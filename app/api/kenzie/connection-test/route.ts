import { z } from "zod";
import { resolveCurrentHouseholdContext } from "@/lib/auth/context";
import { testKenzieOpenAIConnection } from "@/lib/ai/openai";
import { takeConnectionTestRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    test: z.literal("connection"),
  })
  .strict();

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return json({ ok: false, message: "Not found." }, 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "The test request was not valid." }, 400);
  }

  if (!requestSchema.safeParse(body).success) {
    return json({ ok: false, message: "The test request was not valid." }, 400);
  }

  const context = await resolveCurrentHouseholdContext();
  if (!context || context.source !== "supabase") {
    return json({ ok: false, message: "Please sign in before running this test." }, 401);
  }

  if (context.role !== "household_manager") {
    return json(
      {
        ok: false,
        message: "Only the household manager can run the connection test.",
      },
      403,
    );
  }

  const rateLimit = takeConnectionTestRateLimit(context.userId);
  if (!rateLimit.allowed) {
    return json(
      {
        ok: false,
        message: "Please wait before running the connection test again.",
      },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const result = await testKenzieOpenAIConnection();
  if (!result.ok) {
    const status = result.code === "configuration" ? 503 : 502;
    return json({ ok: false, message: result.message }, status);
  }

  return json(
    {
      ok: true,
      message: result.message,
      model: result.model,
    },
    200,
  );
}
