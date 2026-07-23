// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260723210000_core_household.sql"),
  "utf8",
);

describe("core migration security", () => {
  it("enables RLS on every household data table", () => {
    for (const table of [
      "households",
      "family_members",
      "household_memberships",
      "user_profiles",
      "schedule_events",
      "event_participants",
      "tasks",
      "task_assignments",
      "task_completions",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("contains no service-role browser credential", () => {
    expect(migration).not.toMatch(/service[_-]role|secret[_-]key/i);
  });

  it("requires household membership for shared schedule reads", () => {
    expect(migration).toContain(
      "create policy schedule_read on public.schedule_events for select using (public.is_household_member(household_id));",
    );
  });
});
