import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260730060000_production_authorization_api_grants.sql", "utf8");
const repository = readFileSync("lib/data/personal-tools.ts", "utf8");

describe("family wish-list dashboard access", () => {
  it("adds only an authenticated adult household read policy", () => {
    expect(migration).toContain("personal_wish_list_household_adult_select");
    expect(migration).toContain("fm.role in ('household_manager', 'parent')");
    expect(migration).not.toContain("display_name");
    expect(migration).toContain("for select");
    expect(migration).toContain("to authenticated");
  });

  it("reads the existing wish-list table without copying records", () => {
    expect(repository).toContain('from("personal_wish_list_items")');
    expect(repository).toContain('from("family_members")');
    expect(repository).not.toMatch(/insert|upsert|update|delete/);
  });
});
