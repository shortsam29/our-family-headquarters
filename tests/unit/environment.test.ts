import { describe, expect, it } from "vitest";
import { getBackendConfiguration, isDevelopmentAuthBypassEnabled } from "@/lib/environment";

describe("backend environment", () => {
  it("fails safely when credentials are missing", () => {
    expect(getBackendConfiguration({})).toEqual({
      configured: false,
      reason: "Supabase has not been configured for this environment.",
    });
  });

  it("accepts public Supabase configuration without requiring a service key", () => {
    expect(getBackendConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key-with-safe-length",
    })).toMatchObject({ configured: true });
  });

  it("never enables the test bypass in production", () => {
    expect(isDevelopmentAuthBypassEnabled({
      NODE_ENV: "production",
      OFH_AUTH_TEST_BYPASS: "1",
    })).toBe(false);
  });
});
