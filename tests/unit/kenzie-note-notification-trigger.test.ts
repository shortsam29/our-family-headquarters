import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260730032000_harden_kenzie_note_notification_trigger.sql",
  "utf8",
);
const reminderMigration = readFileSync(
  "supabase/migrations/20260730033000_sync_reminder_notifications.sql",
  "utf8",
);

describe("Kenzie note notification trigger hardening", () => {
  it("uses a locked-down definer trigger after the note row passes RLS", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("if auth.uid() is null");
    expect(migration).toContain("revoke all on function public.sync_kenzie_note_notification() from public");
    expect(migration).toContain("revoke all on function public.sync_kenzie_note_notification() from authenticated");
  });

  it("keeps notification ownership tied to the validated note row", () => {
    expect(migration).toContain("new.household_id");
    expect(migration).toContain("new.recipient_member_id");
    expect(migration).toContain("new.created_by_member_id");
    expect(migration).toContain("on conflict (source_note_id)");
  });

  it("uses the same locked-down trigger boundary for reminder notifications", () => {
    expect(reminderMigration).toContain("security definer");
    expect(reminderMigration).toContain("set search_path = ''");
    expect(reminderMigration).toContain("new.recipient_member_id");
    expect(reminderMigration).toContain("source_reminder_id");
    expect(reminderMigration).toContain(
      "revoke all on function public.sync_household_reminder_notification() from authenticated",
    );
  });
});
