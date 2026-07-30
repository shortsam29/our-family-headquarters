import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/lib/auth/context", () => ({ resolveCurrentHouseholdContext: mocks.resolve }));
vi.mock("@/lib/kenzie/memory/service", () => ({ saveMemoryCandidate: mocks.save }));

import { POST } from "@/app/api/kenzie/memory/extract/route";

const context = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  householdName: "Home",
  timeZone: "America/New_York",
  familyMemberId: "00000000-0000-4000-8000-000000000020",
  displayName: "Authenticated Member",
  role: "child",
  source: "supabase",
};

const request = (body: unknown) => new Request("http://localhost/api/kenzie/memory/extract", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("Kenzie post-response memory extraction route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockResolvedValue(context);
    mocks.save.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000099",
      displayText: "You prefer explanations with examples.",
      updated: false,
    });
  });

  it("resolves the owner server-side and returns a saved-memory notice", async () => {
    const response = await POST(request({
      message: "I prefer explanations with examples.",
      conversationId: "00000000-0000-4000-8000-000000000030",
      messageId: "00000000-0000-4000-8000-000000000031",
    }));
    expect(response.status).toBe(200);
    expect(mocks.save).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ category: "preference" }),
      {
        conversationId: "00000000-0000-4000-8000-000000000030",
        messageId: "00000000-0000-4000-8000-000000000031",
      },
    );
    expect(await response.json()).toMatchObject({
      memoryNotice: {
        id: "00000000-0000-4000-8000-000000000099",
      },
    });
  });

  it("rejects spoofed ownership fields and unauthenticated callers", async () => {
    expect((await POST(request({
      message: "I prefer examples.",
      conversationId: "00000000-0000-4000-8000-000000000030",
      messageId: "00000000-0000-4000-8000-000000000031",
      ownerFamilyMemberId: "00000000-0000-4000-8000-000000000099",
    }))).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();

    mocks.resolve.mockResolvedValue(null);
    expect((await POST(request({
      message: "I prefer examples.",
      conversationId: "00000000-0000-4000-8000-000000000030",
      messageId: "00000000-0000-4000-8000-000000000031",
    }))).status).toBe(401);
  });

  it("fails independently without exposing diagnostics", async () => {
    mocks.save.mockRejectedValue(new Error("private database detail"));
    const response = await POST(request({
      message: "I prefer examples.",
      conversationId: "00000000-0000-4000-8000-000000000030",
      messageId: "00000000-0000-4000-8000-000000000031",
    }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private database detail");
  });
});
