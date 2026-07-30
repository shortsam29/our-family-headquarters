import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20260730014726_kenzie_notifications_reminders.sql", "utf8");

describe("Kenzie notifications and reminders migration", () => {
  it("creates recipient-scoped reminders with RLS and explicit grants", () => {
    expect(sql).toContain("create table public.household_reminders");
    expect(sql).toContain("alter table public.household_reminders enable row level security");
    expect(sql).toContain("household_reminders_recipient_read");
    expect(sql).toContain("household_reminders_authorized_create");
    expect(sql).toContain("grant select, insert, update on public.household_reminders to authenticated");
  });

  it("deduplicates note and reminder notifications", () => {
    expect(sql).toContain("internal_notifications_note_once_idx");
    expect(sql).toContain("internal_notifications_reminder_once_idx");
    expect(sql).toContain("internal_notifications_dedupe_idx");
    expect(sql).toContain("sync_kenzie_note_notification");
  });

  it("keeps recipient and creator identity within the same household", () => {
    expect(sql).toContain("foreign key (household_id, recipient_member_id)");
    expect(sql).toContain("foreign key (household_id, created_by_member_id)");
    expect(sql).toContain("public.current_family_member_id(household_id)");
  });
});
