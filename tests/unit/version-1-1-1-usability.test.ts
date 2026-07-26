import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createKenzieNote } from "@/lib/kenzie/intelligence";

const migration = readFileSync("supabase/migrations/20260725220000_family_communication.sql", "utf8");
const scheduleAction = readFileSync("app/actions/schedule.ts", "utf8");
const scheduleInput = readFileSync("lib/schedule/event-input.ts", "utf8");

describe("Version 1.1.1 usability safeguards", () => {
  it("accepts the family category and supplies a one-hour end when omitted", () => {
    expect(scheduleInput).toContain('"household","family","school"');
    expect(scheduleInput).toContain("+3600000");
    expect(scheduleAction).toContain('status: "success"');
  });
  it("creates household-isolated communication with role-aware policies", () => {
    expect(migration).toContain("create table public.family_conversations");
    expect(migration).toContain("create table public.family_announcements");
    expect(migration).toContain("public.is_household_member(household_id)");
    expect(migration).toContain("('household_manager','parent')");
    expect(migration).not.toMatch(/\b(drop|truncate|reset)\b/i);
  });
  it("lets Kenzie notice messages without performing an action", () => {
    const note = createKenzieNote({ audience: "family", scheduledCount: 0, assignedCount: 0, completedCount: 0, overdueCount: 0, upcomingCount: 0, conversationCount: 1 });
    expect(note.title).toBe("A family message is waiting");
    expect(note.message).toContain("You can decide");
  });
});
