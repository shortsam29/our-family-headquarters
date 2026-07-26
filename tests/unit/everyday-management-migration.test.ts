import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260725160000_everyday_management.sql", "utf8");
describe("everyday management migration", () => {
  it("adds only forward-compatible calendar, task, and shopping metadata", () => {
    expect(migration).toContain("add column if not exists description");
    expect(migration).toContain("add column if not exists recurrence");
    expect(migration).toContain("add column if not exists reminder_minutes");
    expect(migration).toContain("add column if not exists priority");
    expect(migration).not.toMatch(/\b(drop|truncate|reset)\b/i);
  });
});
