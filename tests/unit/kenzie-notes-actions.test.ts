import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  createClient: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/auth/context", () => ({ requireCurrentHouseholdContext: mocks.context }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { createKenzieNoteForMember, markKenzieNoteRead } from "@/app/actions/kenzie-notes";

const memberId = "00000000-0000-4000-8000-000000000020";
const recipientId = "00000000-0000-4000-8000-000000000030";
const householdId = "00000000-0000-4000-8000-000000000010";
const manager = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId,
  householdName: "Home",
  timeZone: "America/New_York",
  familyMemberId: memberId,
  displayName: "Manager",
  role: "household_manager",
  source: "supabase",
};

function membershipQuery(recipient: { family_member_id: string } | null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data: recipient, error: null }),
  };
  return query;
}

describe("Kenzie notes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.mockResolvedValue(manager);
  });

  it("allows a manager to create a note only for an active same-household member", async () => {
    const memberships = membershipQuery({ family_member_id: recipientId });
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => table === "household_memberships" ? memberships : { insert }),
    });
    expect(await createKenzieNoteForMember({
      recipientMemberId: recipientId,
      title: "Practice",
      message: "Practice is tomorrow.",
      destination: "/schedule",
    })).toEqual({ ok: true });
    expect(memberships.eq).toHaveBeenCalledWith("household_id", householdId);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      household_id: householdId,
      recipient_member_id: recipientId,
      created_by_member_id: memberId,
    }));
  });

  it("rejects regular members and cross-household recipients", async () => {
    mocks.context.mockResolvedValue({ ...manager, role: "child" });
    expect(await createKenzieNoteForMember({
      recipientMemberId: recipientId,
      title: "Private",
      message: "No.",
    })).toEqual({ ok: false, reason: "forbidden" });
    expect(mocks.createClient).not.toHaveBeenCalled();

    mocks.context.mockResolvedValue(manager);
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => membershipQuery(null)) });
    expect(await createKenzieNoteForMember({
      recipientMemberId: recipientId,
      title: "Other household",
      message: "No.",
    })).toEqual({ ok: false, reason: "forbidden" });
  });

  it("marks a note read only for the authenticated recipient", async () => {
    const query = {
      update: vi.fn(() => query),
      eq: vi.fn(() => query),
    };
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => query) });
    const form = new FormData();
    form.set("noteId", "00000000-0000-4000-8000-000000000040");
    await markKenzieNoteRead(form);
    expect(query.eq).toHaveBeenCalledWith("household_id", householdId);
    expect(query.eq).toHaveBeenCalledWith("recipient_member_id", memberId);
  });
});
