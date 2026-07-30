import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetKenzieChatRateLimitForTests } from "@/lib/ai/rate-limit";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  generate: vi.fn(),
  immediate: vi.fn(),
  confirmed: vi.fn(),
  deleteMemory: vi.fn(),
}));
vi.mock("@/lib/auth/context", () => ({ resolveCurrentHouseholdContext: mocks.resolve }));
vi.mock("@/lib/kenzie/conversation/service", () => ({ generateKenzieReply: mocks.generate }));
vi.mock("@/lib/kenzie/memory/service", () => ({
  deleteAllOwnedMemories: vi.fn(),
  deleteOwnedMemory: mocks.deleteMemory,
  forgetMatchingMemory: vi.fn(),
  listActiveMemories: vi.fn().mockResolvedValue([]),
  saveMemoryCandidate: vi.fn(),
  setMemorySettings: vi.fn(),
}));
vi.mock("@/lib/kenzie/platform/live-actions", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/kenzie/platform/live-actions")>();
  return {
    ...original,
    handleImmediateKenzieAction: mocks.immediate,
    executeKenzieProposal: mocks.confirmed,
  };
});
import { POST } from "@/app/api/kenzie/chat/route";

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
const request = (body: unknown) => new Request("http://localhost/api/kenzie/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("Kenzie chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetKenzieChatRateLimitForTests();
    mocks.resolve.mockResolvedValue(context);
    mocks.generate.mockResolvedValue({ ok: true, message: "Hello from Kenzie." });
    mocks.immediate.mockResolvedValue(null);
    mocks.deleteMemory.mockResolvedValue(true);
  });

  it("requires a real authenticated member", async () => {
    mocks.resolve.mockResolvedValue({ ...context, source: "development-fixture" });
    expect((await POST(request({ message: "Hi", history: [] }))).status).toBe(401);
  });

  it("rejects browser-submitted identity and provider controls", async () => {
    const response = await POST(request({ message: "Hi", history: [], familyMemberId: "spoofed", providers: ["calendar"] }));
    expect(response.status).toBe(400);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("preserves general conversation without an action", async () => {
    const response = await POST(request({ message: "Help with fractions", history: [] }));
    expect(response.status).toBe(200);
    expect(mocks.generate).toHaveBeenCalledWith(context, { message: "Help with fractions", history: [] });
  });

  it("returns action proposals and executes only validated confirmed actions", async () => {
    const proposal = { kind: "create_calendar_event", title: "Practice", date: "2030-01-02", time: "17:00" };
    mocks.immediate.mockResolvedValue({ status: "proposal", message: "Confirm?", proposal });
    expect(await (await POST(request({ message: "Schedule practice on 2030-01-02 at 17:00", history: [] }))).json())
      .toEqual({ ok: true, status: "proposal", message: "Confirm?", proposal });

    resetKenzieChatRateLimitForTests();
    mocks.confirmed.mockResolvedValue({ status: "completed", message: "Saved." });
    await POST(request({ message: "Confirm", history: [], confirmedAction: proposal }));
    expect(mocks.confirmed).toHaveBeenCalledWith(context, proposal);
  });

  it("rejects unapproved confirmed action names", async () => {
    const response = await POST(request({
      message: "Confirm",
      history: [],
      confirmedAction: { kind: "change_role", role: "household_manager" },
    }));
    expect(response.status).toBe(400);
    expect(mocks.confirmed).not.toHaveBeenCalled();
  });

  it("validates undo through the current owner", async () => {
    const undoId = "00000000-0000-4000-8000-000000000099";
    const undo = await POST(request({
      message: "Undo that memory",
      history: [],
      undoMemoryId: undoId,
    }));
    expect(undo.status).toBe(200);
    expect(mocks.deleteMemory).toHaveBeenCalledWith(context, undoId);
  });
});
