// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260725020000_household_invitations.sql"), "utf8");
describe("household invitation security", () => {
  it("uses RLS, hashed codes, expiration, and single-use redemption", () => {
    expect(migration).toContain("alter table public.household_invitations enable row level security");
    expect(migration).toContain("extensions.digest(upper(trim(invitation_code)),'sha256')");
    expect(migration).toContain("expires_at>now()");
    expect(migration).toContain("status='redeemed'");
  });
  it("keeps creation and removal role-aware", () => {
    expect(migration).toMatch(/current_member_role\(household_id\)[\s\S]*household_manager[\s\S]*parent/);
    expect(migration).toContain("target.role='household_manager'");
    expect(migration).toContain("actor_role not in ('household_manager','parent')");
  });
  it("grants only narrow public functions", () => {
    expect(migration).toContain("grant execute on function public.validate_household_invitation(text) to anon,authenticated");
    expect(migration).toContain("grant execute on function public.redeem_household_invitation(text) to authenticated");
    expect(migration).not.toMatch(/service[_-]role|secret[_-]key/i);
  });
});
