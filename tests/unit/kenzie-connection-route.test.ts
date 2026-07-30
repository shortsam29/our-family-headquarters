import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConnectionTestRateLimitForTests } from "@/lib/ai/rate-limit";

const { resolveCurrentHouseholdContext, testKenzieOpenAIConnection } = vi.hoisted(
  () => ({
    resolveCurrentHouseholdContext: vi.fn(),
    testKenzieOpenAIConnection: vi.fn(),
  }),
);

vi.mock("@/lib/auth/context", () => ({
  resolveCurrentHouseholdContext,
}));

vi.mock("@/lib/ai/openai", () => ({
  testKenzieOpenAIConnection,
}));

import { POST } from "@/app/api/kenzie/connection-test/route";

const managerContext = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  householdName: "Test Household",
  timeZone: "America/New_York",
  familyMemberId: "00000000-0000-4000-8000-000000000020",
  displayName: "Test Manager",
  role: "household_manager",
  source: "supabase",
};

function request(body: unknown = { test: "connection" }) {
  return new Request("http://localhost/api/kenzie/connection-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Kenzie connection test route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConnectionTestRateLimitForTests();
    resolveCurrentHouseholdContext.mockResolvedValue(managerContext);
    testKenzieOpenAIConnection.mockResolvedValue({
      ok: true,
      message: "Kenzie connection successful.",
      model: "gpt-5.6-luna",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is unavailable in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(resolveCurrentHouseholdContext).not.toHaveBeenCalled();
    expect(testKenzieOpenAIConnection).not.toHaveBeenCalled();
  });

  it("requires the fixed connection-test payload", async () => {
    const response = await POST(request({ prompt: "private family data" }));
    expect(response.status).toBe(400);
    expect(testKenzieOpenAIConnection).not.toHaveBeenCalled();
  });

  it("requires a real authenticated Supabase session", async () => {
    resolveCurrentHouseholdContext.mockResolvedValue({
      ...managerContext,
      source: "development-fixture",
    });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(testKenzieOpenAIConnection).not.toHaveBeenCalled();
  });

  it("allows only the household manager", async () => {
    resolveCurrentHouseholdContext.mockResolvedValue({
      ...managerContext,
      role: "parent",
    });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(testKenzieOpenAIConnection).not.toHaveBeenCalled();
  });

  it("returns only the sanitized successful response", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      message: "Kenzie connection successful.",
      model: "gpt-5.6-luna",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rate limits repeated calls by authenticated user", async () => {
    await POST(request());
    await POST(request());
    await POST(request());
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(testKenzieOpenAIConnection).toHaveBeenCalledTimes(3);
  });

  it("sanitizes provider failures", async () => {
    testKenzieOpenAIConnection.mockResolvedValue({
      ok: false,
      code: "provider",
      message:
        "Kenzie could not reach the AI service. Check the server configuration and try again.",
    });
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message:
        "Kenzie could not reach the AI service. Check the server configuration and try again.",
    });
  });
});
