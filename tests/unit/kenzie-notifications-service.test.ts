import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));
import { getMyNotifications, getMyReminders, getMyUnreadNotificationCount } from "@/lib/kenzie/notifications/service";

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

function query(finalMethod: "limit" | "is", result: unknown) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order", "limit", "is"]) builder[method] = vi.fn(() => builder);
  builder[finalMethod] = vi.fn().mockResolvedValue(result);
  return builder;
}

describe("Kenzie notification service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads only the authenticated member's notifications", async () => {
    const builder = query("limit", { data: [], error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => builder) });
    expect(await getMyNotifications(context)).toEqual([]);
    expect(builder.eq).toHaveBeenCalledWith("household_id", context.householdId);
    expect(builder.eq).toHaveBeenCalledWith("recipient_member_id", context.familyMemberId);
  });

  it("counts only the current member's unread notifications", async () => {
    const builder = query("is", { count: 3, error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => builder) });
    expect(await getMyUnreadNotificationCount(context)).toBe(3);
    expect(builder.eq).toHaveBeenCalledWith("recipient_member_id", context.familyMemberId);
  });

  it("loads only pending reminders for the authenticated member", async () => {
    const builder = query("limit", { data: [], error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => builder) });
    expect(await getMyReminders(context)).toEqual([]);
    expect(builder.eq).toHaveBeenCalledWith("recipient_member_id", context.familyMemberId);
    expect(builder.eq).toHaveBeenCalledWith("status", "pending");
  });
});
