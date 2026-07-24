const longDateOptions: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
};

export function formatLocalDate(date: Date, locale?: string | string[]) {
  return new Intl.DateTimeFormat(locale, longDateOptions).format(date);
}

export function toLocalDateIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toZonedDateIso(
  date: Date,
  timeZone: string,
  locale: string | string[] = "en-CA",
) {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type === "year" || part.type === "month" || part.type === "day")
      .map((part) => [part.type, part.value]),
  );

  if (!values.year || !values.month || !values.day) {
    throw new RangeError("The local calendar date could not be formatted.");
  }

  return `${values.year}-${values.month}-${values.day}`;
}

export function millisecondsUntilNextLocalDay(date: Date) {
  const nextDay = new Date(date);
  nextDay.setHours(24, 0, 0, 0);
  return nextDay.getTime() - date.getTime();
}
