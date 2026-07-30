import { householdLocalDateTimeToIso } from "@/lib/schedule/event-input";
import { nextRecurringDate, type CalendarRecurrence } from "@/lib/schedule/recurrence";
import { toZonedDateIso } from "@/lib/today/date";

export function nextReminderDueAt(dueAt: string, timeZone: string, recurrence: CalendarRecurrence) {
  const instant = new Date(dueAt);
  const date = toZonedDateIso(instant, timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "09";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const dayAfter = new Date(`${date}T12:00:00Z`);
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
  const nextDate = nextRecurringDate(date, recurrence, dayAfter.toISOString().slice(0, 10));
  return nextDate ? householdLocalDateTimeToIso(nextDate, `${hour}:${minute}`, timeZone) : null;
}
