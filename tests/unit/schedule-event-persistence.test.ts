import { describe, expect, it } from "vitest";
import { buildScheduleEventRow, calendarRangeContains, householdLocalDateTimeToIso, isUpcomingEvent, parseScheduleEventForm } from "@/lib/schedule/event-input";

const context = { householdId: "11111111-1111-4111-8111-111111111111", familyMemberId: "22222222-2222-4222-8222-222222222222", timeZone: "America/New_York" };
function payload(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  return data;
}

describe("schedule event persistence input", () => {
  it("parses the form field names used by the calendar", () => {
    const result = parseScheduleEventForm(payload({ title: "Doctor's appointment", date: "2026-08-03", startTime: "11:00", endTime: "12:00", category: "household", participantIds: [context.familyMemberId], recurrence: "", reminderMinutes: "15" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ title: "Doctor's appointment", date: "2026-08-03", startTime: "11:00", participantIds: [context.familyMemberId] });
  });

  it("assigns the household and preserves the selected local time", () => {
    const parsed = parseScheduleEventForm(payload({ title: "Appointment", date: "2026-08-03", startTime: "11:00", endTime: "12:00", category: "appointment", recurrence: "", reminderMinutes: "" }));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(buildScheduleEventRow(parsed.data, context)).toMatchObject({ household_id: context.householdId, starts_at: "2026-08-03T15:00:00.000Z", ends_at: "2026-08-03T16:00:00.000Z", all_day_date: null });
  });

  it("preserves an all-day date without UTC conversion", () => {
    const parsed = parseScheduleEventForm(payload({ title: "Family day", date: "2026-08-31", allDay: "on", category: "family", recurrence: "", reminderMinutes: "" }));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(buildScheduleEventRow(parsed.data, context)).toMatchObject({ is_all_day: true, all_day_date: "2026-08-31", starts_at: null, ends_at: null });
  });

  it("handles local dates near UTC month boundaries", () => {
    expect(householdLocalDateTimeToIso("2026-08-31", "23:30", "America/New_York")).toBe("2026-09-01T03:30:00.000Z");
  });

  it("includes future events in day, week, month, and upcoming projections", () => {
    expect(calendarRangeContains("2026-08-03", "2026-08-03", "day")).toBe(true);
    expect(calendarRangeContains("2026-08-05", "2026-08-03", "week")).toBe(true);
    expect(calendarRangeContains("2026-08-31", "2026-08-03", "month")).toBe(true);
    expect(isUpcomingEvent("2026-08-03", "2026-07-26")).toBe(true);
  });
});