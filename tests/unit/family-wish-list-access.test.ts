import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260726233000_family_wish_list_dashboard.sql", "utf8");
const repository = readFileSync("lib/data/personal-tools.ts", "utf8");

describe("family wish-list dashboard access", () => {
  it("adds only a Samantha household read policy", () => {
    expect(migration).toContain("wish_list_samantha_household_select");
    expect(migration).toContain("lower(fm.display_name) like 'samantha%'");
    expect(migration).toContain("for select");
    expect(migration).not.toMatch(/for (insert|update|delete|all)/);
  });

  it("reads the existing wish-list table without copying records", () => {
    expect(repository).toContain('from("personal_wish_list_items")');
    expect(repository).toContain('from("family_members")');
    expect(repository).not.toMatch(/insert|upsert|update|delete/);
  });
});
