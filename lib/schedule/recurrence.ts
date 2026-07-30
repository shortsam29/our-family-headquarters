export type CalendarRecurrence = "daily" | "weekly" | "monthly" | "yearly";

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const atNoon = (value: string) => new Date(`${value}T12:00:00`);

export function recurrenceOccursOn(
  seriesStart: string,
  date: string,
  recurrence?: CalendarRecurrence,
) {
  if (!recurrence) return date === seriesStart;
  if (date < seriesStart) return false;
  const start = atNoon(seriesStart);
  const candidate = atNoon(date);
  const differenceDays = Math.round((candidate.getTime() - start.getTime()) / 86_400_000);
  if (recurrence === "daily") return true;
  if (recurrence === "weekly") return differenceDays % 7 === 0;
  if (recurrence === "monthly") return candidate.getDate() === start.getDate();
  return candidate.getMonth() === start.getMonth() && candidate.getDate() === start.getDate();
}

export function recurringDates(
  seriesStart: string,
  recurrence: CalendarRecurrence,
  from: string,
  to: string,
  limit = 750,
) {
  const cursor = atNoon(from < seriesStart ? seriesStart : from);
  const end = atNoon(to);
  const dates: string[] = [];
  while (cursor <= end && dates.length < limit) {
    const value = iso(cursor);
    if (recurrenceOccursOn(seriesStart, value, recurrence)) dates.push(value);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function nextRecurringDate(
  seriesStart: string,
  recurrence: CalendarRecurrence,
  onOrAfter: string,
) {
  return recurringDates(seriesStart, recurrence, onOrAfter, (() => {
    const end = atNoon(onOrAfter);
    end.setFullYear(end.getFullYear() + 2);
    return iso(end);
  })(), 1)[0];
}
