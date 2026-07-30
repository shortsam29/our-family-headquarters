import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveAuthenticatedMemberProfile } from "@/lib/kenzie/profiles/association";
import { resolveMemberProfileFromSources } from "@/lib/kenzie/profiles/registry";

const memberId = "00000000-0000-4000-8000-000000000301";
const context = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  familyMemberId: memberId,
  householdName: "Test Home",
  timeZone: "America/New_York",
  displayName: "Authenticated Member",
  role: "child" as const,
  source: "supabase" as const,
};

describe("Kenzie managed profile resolution", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("selects a valid database association", () => {
    expect(resolveMemberProfileFromSources(memberId, "Member", { status: "found", profileKey: "braeden" }, {}).key).toBe("braeden");
  });

  it("gives the database association precedence over the environment fallback", () => {
    expect(resolveMemberProfileFromSources(memberId, "Member", { status: "found", profileKey: "braeden" }, { [memberId]: "robbie" }).key).toBe("braeden");
  });

  it("fails closed for an invalid database profile key", () => {
    expect(resolveMemberProfileFromSources(memberId, "Member", { status: "found", profileKey: "not-approved" }, { [memberId]: "robbie" }).key).toBe("default");
  });

  it("treats an explicitly cleared database association as the safe default", () => {
    expect(resolveMemberProfileFromSources(memberId, "Member", { status: "found", profileKey: null }, { [memberId]: "robbie" }).key).toBe("default");
  });

  it("uses the safe default when no association or compatibility mapping exists", () => {
    expect(resolveMemberProfileFromSources(memberId, "Member", { status: "missing" }, {}).key).toBe("default");
  });

  it("uses the transitional environment mapping when the association source is unavailable", async () => {
    vi.stubEnv("KENZIE_PROFILE_MEMBER_MAP", JSON.stringify({ [memberId]: "braeden" }));
    const profile = await resolveAuthenticatedMemberProfile(context, async () => {
      throw new Error("database unavailable");
    });
    expect(profile.key).toBe("braeden");
  });

  it.each(["samantha", "jason", "braeden"] as const)("keeps the %s compatibility profile available during transition", (key) => {
    expect(resolveMemberProfileFromSources(memberId, "Member", { status: "missing" }, { [memberId]: key }).key).toBe(key);
  });
});
