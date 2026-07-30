import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));
import { getMyKenzieNotes } from "@/lib/kenzie/notes/service";
import { getMyUnreadNotificationCount } from "@/lib/kenzie/notifications/service";

const context = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  householdName: "Home",
  timeZone: "America/New_York",
  familyMemberId: "00000000-0000-4000-8000-000000000020",
  displayName: "Member",
  role: "child" as const,
  source: "supabase" as const,
};

function chain(final: unknown) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order", "limit", "is"]) builder[method] = vi.fn(() => builder);
  builder.limit = vi.fn().mockResolvedValue(final);
  builder.is = vi.fn(() => builder);
  return builder;
}

describe("Kenzie notes service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes note visibility to the authenticated household member", async () => {
    const query = chain({ data: [{
      id: "00000000-0000-4000-8000-000000000030",
      title: "Hello",
      message: "A private note",
      related_destination: null,
      created_at: "2030-01-01T00:00:00.000Z",
      read_at: null,
    }], error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) });
    const notes = await getMyKenzieNotes(context);
    expect(query.eq).toHaveBeenCalledWith("household_id", context.householdId);
    expect(query.eq).toHaveBeenCalledWith("recipient_member_id", context.familyMemberId);
    expect(notes).toEqual([expect.objectContaining({ title: "Hello", read: false })]);
  });

  it("counts only the authenticated member's unread notes and fails closed", async () => {
    const query = chain({ count: 2, error: null });
    query.is.mockResolvedValue({ count: 2, error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) });
    expect(await getMyUnreadNotificationCount(context)).toBe(2);
    expect(query.eq).toHaveBeenCalledWith("recipient_member_id", context.familyMemberId);

    mocks.createClient.mockResolvedValue(null);
    expect(await getMyUnreadNotificationCount(context)).toBe(0);
  });
});
