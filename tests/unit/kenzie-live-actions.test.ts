import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { executeKenzieProposal, handleImmediateKenzieAction } from "@/lib/kenzie/platform/live-actions";

const child = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  householdName: "Home",
  timeZone: "America/New_York",
  familyMemberId: "00000000-0000-4000-8000-000000000020",
  displayName: "Member",
  role: "child" as const,
  source: "supabase" as const,
};
const manager = { ...child, role: "household_manager" as const };

describe("Kenzie live actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a shopping item using only trusted household and member identity", async () => {
    const itemInsert = vi.fn().mockResolvedValue({ error: null });
    const listSingle = vi.fn().mockResolvedValue({ data: { id: "list-id" }, error: null });
    const listBuilder = { upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: listSingle })) })) };
    const itemBuilder = { insert: itemInsert };
    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => table === "shopping_lists" ? listBuilder : itemBuilder),
    });

    expect(await handleImmediateKenzieAction(child, "Add milk to the grocery list")).toMatchObject({ status: "completed" });
    expect(listBuilder.upsert).toHaveBeenCalledWith(expect.objectContaining({
      household_id: child.householdId,
      created_by_member_id: child.familyMemberId,
    }), expect.anything());
    expect(itemInsert).toHaveBeenCalledWith(expect.objectContaining({
      household_id: child.householdId,
      added_by_member_id: child.familyMemberId,
      name: "milk",
    }));
  });

  it("requires an authorized role before confirmed calendar or meal writes", async () => {
    expect(await executeKenzieProposal(child, {
      kind: "create_calendar_event",
      title: "Practice",
      date: "2030-01-02",
      time: "17:00",
    })).toEqual({ status: "failed", message: "A parent or household manager needs to make that change." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("creates a confirmed calendar event inside the trusted household", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => ({ insert })) });
    expect(await executeKenzieProposal(manager, {
      kind: "create_calendar_event",
      title: "Practice",
      date: "2030-01-02",
      time: "17:00",
    })).toMatchObject({ status: "completed" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      household_id: manager.householdId,
      created_by_member_id: manager.familyMemberId,
      title: "Practice",
    }));
  });

  it("marks only a matching chore assigned to the authenticated member", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "assignment-id" }, error: null });
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      ilike: vi.fn(() => query),
      limit: vi.fn(() => query),
      maybeSingle,
    };
    const completionUpsert = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => table === "task_assignments" ? query : { upsert: completionUpsert }),
    });
    expect(await handleImmediateKenzieAction(child, "Mark dishes complete")).toMatchObject({ status: "completed" });
    expect(query.eq).toHaveBeenCalledWith("family_member_id", child.familyMemberId);
    expect(completionUpsert).toHaveBeenCalledWith(expect.objectContaining({
      task_assignment_id: "assignment-id",
      completed_by_member_id: child.familyMemberId,
    }), expect.anything());
  });
});
