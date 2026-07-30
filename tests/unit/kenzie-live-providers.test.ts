import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));
import {
  assembleKenziePlatformContext,
  calendarProvider,
  choreProvider,
  mealProvider,
  shoppingProvider,
} from "@/lib/kenzie/platform/providers";

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

function query(result: unknown) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "is", "or", "gte", "lt", "order", "limit"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.limit = vi.fn().mockResolvedValue(result);
  return builder;
}

describe("Kenzie live context providers", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [calendarProvider, "schedule_events"],
    [shoppingProvider, "shopping_list_items"],
    [mealProvider, "meal_plan_entries"],
  ])("scopes %s to the trusted household", async (provider, table) => {
    const builder = query({ data: [], error: null });
    const from = vi.fn(() => builder);
    mocks.createClient.mockResolvedValue({ from });
    expect((await provider.load(context)).status).toBe("available");
    expect(from).toHaveBeenCalledWith(table);
    expect(builder.eq).toHaveBeenCalledWith("household_id", context.householdId);
  });

  it("returns only the current member's chore assignments for a child", async () => {
    const builder = query({ data: [], error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => builder) });
    expect((await choreProvider.load(context)).status).toBe("available");
    expect(builder.eq).toHaveBeenCalledWith("family_member_id", context.familyMemberId);
  });

  it("isolates provider failures so general conversation can continue", async () => {
    const builder = query({ data: null, error: { message: "offline" } });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => builder) });
    expect(await assembleKenziePlatformContext(context, [calendarProvider, shoppingProvider])).toEqual({});
  });

  it("rejects untrusted fixture contexts without querying", async () => {
    expect(await calendarProvider.load({ ...context, source: "development-fixture" })).toEqual({ status: "forbidden" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
