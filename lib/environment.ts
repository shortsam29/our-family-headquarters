import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export type BackendConfiguration =
  | { configured: true; url: string; publishableKey: string }
  | { configured: false; reason: string };

export function getBackendConfiguration(
  source: Record<string, string | undefined> = process.env,
): BackendConfiguration {
  const result = publicEnvironmentSchema.safeParse(source);
  if (!result.success) {
    return {
      configured: false,
      reason: "Supabase has not been configured for this environment.",
    };
  }
  return {
    configured: true,
    url: result.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function isDevelopmentAuthBypassEnabled(
  source: Record<string, string | undefined> = process.env,
) {
  return source.NODE_ENV !== "production" && source.OFH_AUTH_TEST_BYPASS === "1";
}
