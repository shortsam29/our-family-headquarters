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
    const existingQuery = {
      select: vi.fn(() => existingQuery),
      eq: vi.fn(() => existingQuery),
      ilike: vi.fn(() => existingQuery),
      limit: vi.fn(() => existingQuery),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: itemInsert,
    };
    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => table === "shopping_lists" ? listBuilder : existingQuery),
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
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert,
    };
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) });
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

  it("creates a reminder without requiring cross-recipient read access", async () => {
    const reminderInsert = vi.fn().mockResolvedValue({ error: null });
    const recipientQuery = {
      select: vi.fn(() => recipientQuery),
      eq: vi.fn(() => recipientQuery),
      ilike: vi.fn(() => recipientQuery),
      limit: vi.fn().mockResolvedValue({
        data: [{
          family_member_id: "00000000-0000-4000-8000-000000000099",
          family_members: { display_name: "Other Member" },
        }],
        error: null,
      }),
    };
    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => table === "household_memberships"
        ? recipientQuery
        : { insert: reminderInsert }),
    });

    expect(await executeKenzieProposal(manager, {
      kind: "create_reminder",
      recipientSearch: "Other Member",
      recipientLabel: "Other Member",
      message: "Practice starts soon",
      date: "2030-01-02",
      time: "17:00",
    })).toMatchObject({ status: "completed" });
    expect(reminderInsert).toHaveBeenCalledWith(expect.objectContaining({
      household_id: manager.householdId,
      recipient_member_id: "00000000-0000-4000-8000-000000000099",
      created_by_member_id: manager.familyMemberId,
    }));
  });

  it("creates a self note once and treats an exact retry as already delivered", async () => {
    const noteInsert = vi.fn().mockResolvedValue({ error: null });
    const noteQuery = {
      select: vi.fn(() => noteQuery),
      eq: vi.fn(() => noteQuery),
      is: vi.fn(() => noteQuery),
      limit: vi.fn(() => noteQuery),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { id: "existing-note" }, error: null }),
      insert: noteInsert,
    };
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => noteQuery) });
    const proposal = {
      kind: "create_note" as const,
      requestId: "00000000-0000-4000-8000-000000000077",
      recipientSearch: "me",
      recipientLabel: "Member",
      title: "Tomorrow",
      message: "Remember the permission slip",
    };

    expect(await executeKenzieProposal(manager, proposal)).toMatchObject({ status: "completed" });
    expect(await executeKenzieProposal(manager, proposal)).toEqual({
      status: "completed",
      message: "That note is already waiting for Member.",
    });
    expect(noteInsert).toHaveBeenCalledTimes(1);
    expect(noteInsert).toHaveBeenCalledWith(expect.objectContaining({
      household_id: manager.householdId,
      recipient_member_id: manager.familyMemberId,
      created_by_member_id: manager.familyMemberId,
    }));
  });

  it("treats a duplicate reminder retry as completed without a second row", async () => {
    const reminderInsert = vi.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => ({ insert: reminderInsert })) });

    expect(await executeKenzieProposal(manager, {
      kind: "create_reminder",
      recipientSearch: "me",
      recipientLabel: "Member",
      message: "Review the family calendar",
      date: "2030-01-08",
      time: "09:00",
    })).toEqual({
      status: "completed",
      message: "That reminder is already set for Member.",
    });
    expect(reminderInsert).toHaveBeenCalledTimes(1);
  });

  it("marks only a matching chore assigned to the authenticated member", async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      ilike: vi.fn(() => query),
      limit: vi.fn().mockResolvedValue({ data: [{ id: "assignment-id" }], error: null }),
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
