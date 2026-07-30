import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  client: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/auth/context", () => ({ requireCurrentHouseholdContext: mocks.context }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { saveKenzieProfileAssociation } from "@/app/actions/kenzie-profiles";

const householdId = "00000000-0000-4000-8000-000000000010";
const actorId = "00000000-0000-4000-8000-000000000020";
const memberId = "00000000-0000-4000-8000-000000000021";
const managerContext = { householdId, familyMemberId: actorId, role: "household_manager" };
const form = (profileKey: string, target = memberId) => {
  const data = new FormData();
  data.set("memberId", target);
  data.set("profileKey", profileKey);
  return data;
};

function clientWithMembership(found = true) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: found ? { family_member_id: memberId } : null });
  const membershipQuery = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const deleteQuery = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: undefined };
  deleteQuery.eq.mockImplementation(function () {
    if (deleteQuery.eq.mock.calls.length === 2) return Promise.resolve({ error: null });
    return deleteQuery;
  });
  const from = vi.fn((table: string) => table === "household_memberships"
    ? membershipQuery
    : { upsert, delete: deleteQuery.delete, eq: deleteQuery.eq });
  return { client: { from }, upsert, deleteQuery };
}

describe("Kenzie profile assignment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.mockResolvedValue(managerContext);
  });

  it("allows a manager to assign a validated profile in their household", async () => {
    const setup = clientWithMembership();
    mocks.client.mockResolvedValue(setup.client);
    expect(await saveKenzieProfileAssociation({}, form("braeden"))).toMatchObject({ memberId, saved: true });
    expect(setup.upsert).toHaveBeenCalledWith(expect.objectContaining({ household_id: householdId, family_member_id: memberId, profile_key: "braeden", assigned_by_member_id: actorId }), { onConflict: "family_member_id" });
  });

  it("rejects a regular member before accessing the database", async () => {
    mocks.context.mockResolvedValue({ ...managerContext, role: "child" });
    expect(await saveKenzieProfileAssociation({}, form("robbie"))).toMatchObject({ error: expect.any(String) });
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("rejects a member outside the authorized household", async () => {
    const setup = clientWithMembership(false);
    mocks.client.mockResolvedValue(setup.client);
    expect(await saveKenzieProfileAssociation({}, form("fran"))).toMatchObject({ error: expect.any(String) });
    expect(setup.upsert).not.toHaveBeenCalled();
  });

  it("rejects browser-submitted profile keys outside the approved registry", async () => {
    expect(await saveKenzieProfileAssociation({}, form("administrator"))).toEqual({ error: "Choose a valid Kenzie profile." });
    expect(mocks.context).not.toHaveBeenCalled();
  });

  it("clears an association to restore safe-default resolution", async () => {
    const setup = clientWithMembership();
    mocks.client.mockResolvedValue(setup.client);
    expect(await saveKenzieProfileAssociation({}, form(""))).toMatchObject({ saved: true });
    expect(setup.deleteQuery.delete).toHaveBeenCalled();
  });
});
