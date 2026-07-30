import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260729220000_kenzie_platform_foundation.sql", "utf8");

describe("Kenzie platform persistence migration", () => {
  it("stores private recipient notes without conversation or personality data", () => {
    expect(migration).toContain("create table public.kenzie_notes");
    expect(migration).toContain("recipient_member_id uuid not null");
    expect(migration).toContain("created_by_kind");
    expect(migration).toContain("read_at timestamptz");
    expect(migration).not.toMatch(/conversation_history|traits|interests|motivations|profile_key/i);
  });

  it("creates an internal-only notification foundation", () => {
    expect(migration).toContain("create table public.internal_notifications");
    expect(migration).toContain("'kenzie_note', 'reminder', 'chore', 'shopping', 'meal', 'calendar'");
    expect(migration).not.toMatch(/push_token|email_address|phone_number|sms/i);
  });

  it("limits note and notification reads to the authenticated recipient", () => {
    expect(migration.match(/recipient_member_id = public\.current_family_member_id\(household_id\)/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration).toContain("alter table public.kenzie_notes enable row level security");
    expect(migration).toContain("alter table public.internal_notifications enable row level security");
    expect(migration).not.toContain("grant insert on public.internal_notifications");
  });
});
