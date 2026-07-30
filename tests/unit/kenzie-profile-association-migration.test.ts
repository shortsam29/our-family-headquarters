import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260729210000_kenzie_profile_associations.sql", "utf8");

describe("Kenzie profile association migration", () => {
  it("stores only a constrained stable profile association and audit metadata", () => {
    expect(migration).toContain("create table public.kenzie_profile_associations");
    expect(migration).toContain("profile_key text check");
    expect(migration).toContain("assigned_by_member_id uuid not null");
    expect(migration).not.toMatch(/traits|interests|motivations|goals|conversation|memory/i);
  });

  it("enforces household membership integrity with composite foreign keys", () => {
    expect(migration).toContain("foreign key (household_id, family_member_id)");
    expect(migration).toContain("foreign key (household_id, assigned_by_member_id)");
    expect(migration).toContain("unique (household_id, profile_key)");
  });

  it("keeps reads private and writes manager-authorized through RLS", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("family_member_id = public.current_family_member_id(household_id)");
    expect(migration).toContain("public.current_member_role(household_id) in ('household_manager', 'parent')");
    expect(migration).toContain("assigned_by_member_id = public.current_family_member_id(household_id)");
    expect(migration).toContain("to authenticated");
  });
});
