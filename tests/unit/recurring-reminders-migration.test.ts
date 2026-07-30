import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("recurring reminder migration", () => {
  const sql = readFileSync("supabase/migrations/20260730040000_recurring_household_reminders.sql", "utf8");

  it("adds a constrained recurrence field and refreshes the private notification", () => {
    expect(sql).toContain("add column if not exists recurrence");
    expect(sql).toContain("'daily', 'weekly', 'monthly', 'yearly'");
    expect(sql).toContain("new.due_at is distinct from old.due_at");
    expect(sql).toContain("set read_at = null");
  });
});
