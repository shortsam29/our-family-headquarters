// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { updateSupabaseSession } from "@/lib/supabase/proxy";
import { config } from "@/proxy";

const originalBypass = process.env.OFH_AUTH_TEST_BYPASS;

afterEach(() => {
  process.env.OFH_AUTH_TEST_BYPASS = originalBypass;
});

describe("route protection", () => {
  it("redirects safely when backend configuration is absent", async () => {
    delete process.env.OFH_AUTH_TEST_BYPASS;
    const response = await updateSupabaseSession(new NextRequest("http://localhost:3000/schedule"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in?status=configuration");
  });

  it("refreshes sessions on every private primary route and Vault endpoint", () => {
    for (const route of ["/my-headquarters/:path*", "/moms-planner/:path*", "/tasks/:path*", "/grocery/:path*", "/weather/:path*", "/api/vault/:path*"]) {
      expect(config.matcher).toContain(route);
    }
  });});
