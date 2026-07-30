import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canUsePersonalizedPlanner } from "@/lib/data/personalized-planner";

const migration = readFileSync(
  "supabase/migrations/20260730060000_production_authorization_api_grants.sql",
  "utf8",
);

describe("production database authorization hardening", () => {
  it("keeps authorization stable when a member is renamed", () => {
    expect(canUsePersonalizedPlanner("household_manager")).toBe(true);
    expect(canUsePersonalizedPlanner("parent")).toBe(true);
  });

  it("does not grant access from a privileged-looking display name", () => {
    expect(canUsePersonalizedPlanner("child")).toBe(false);
    expect(canUsePersonalizedPlanner("caregiver")).toBe(false);
    expect(canUsePersonalizedPlanner("guest")).toBe(false);
    expect(migration).not.toContain("display_name");
  });

  it("requires the authenticated user, member, household, and adult role", () => {
    expect(migration).toContain("hm.household_id = target_household");
    expect(migration).toContain("hm.family_member_id = target_member");
    expect(migration).toContain("hm.user_id = (select auth.uid())");
    expect(migration).toContain("fm.linked_user_id = (select auth.uid())");
    expect(migration).toContain("fm.role in ('household_manager', 'parent')");
  });

  it("hardens security-definer execution", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      "revoke all on function public.can_view_household_wish_lists(uuid) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.can_view_household_wish_lists(uuid) to authenticated",
    );
    expect(migration).not.toContain(
      "grant execute on function public.can_view_household_wish_lists(uuid) to anon",
    );
  });

  it("provides explicit Data API access without anonymous table privileges", () => {
    expect(migration).toContain("from anon, authenticated");
    expect(migration).toContain("grant select, update on public.households to authenticated");
    expect(migration).toContain(
      "grant select, insert, delete on public.event_participants to authenticated",
    );
    expect(migration).toContain(
      "grant select, insert on public.recipe_ingredients to authenticated",
    );
    expect(migration).not.toContain(
      "grant select, insert, update, delete on public.recipe_ingredients",
    );
    expect(migration).not.toMatch(
      /grant\s+(select|insert|update|delete)(?:\s*,\s*(select|insert|update|delete))*\s+on\s+[^;]+\s+to\s+anon/i,
    );
    expect(migration).not.toMatch(/grant\s+all/i);
    expect(migration).not.toMatch(/to\s+service_role/i);
  });

  it("limits anonymous function execution to invitation validation", () => {
    const anonymousFunctionGrants =
      migration.match(/grant execute on function [^;]+ to anon[^;]*;/gi) ?? [];
    expect(anonymousFunctionGrants).toHaveLength(1);
    expect(anonymousFunctionGrants[0]).toContain(
      "validate_household_invitation(text)",
    );
  });
});
