import { describe, expect, it } from "vitest";
import { parseMemberProfileMap, resolveMemberProfile } from "@/lib/kenzie/profiles/registry";

const memberId = "00000000-0000-4000-8000-000000000201";
const otherMemberId = "00000000-0000-4000-8000-000000000202";

describe("Kenzie Phase 3 privacy evaluation", () => {
  it("fails closed when the server-only profile map is malformed", () => {
    expect(parseMemberProfileMap("not-json")).toEqual({});
    expect(parseMemberProfileMap(JSON.stringify({ [memberId]: "unknown-profile" }))).toEqual({});
  });

  it("does not disclose personalized profile fields to an unmapped member", () => {
    const profile = resolveMemberProfile(otherMemberId, "Household Member", {
      [memberId]: "braeden",
    });

    expect(profile.key).toBe("default");
    expect(profile.traits).toEqual([]);
    expect(profile.interests).toEqual([]);
    expect(profile.motivations).toEqual([]);
    expect(profile.goals).toEqual([]);
    expect(profile.capabilities.parentalAuthority).toBe(false);
  });

  it("cannot switch profiles through a display-name claim", () => {
    const profile = resolveMemberProfile(memberId, "Robbie", {
      [memberId]: "braeden",
    });

    expect(profile.key).toBe("braeden");
    expect(profile.name).toBe("Robbie");
  });
});
