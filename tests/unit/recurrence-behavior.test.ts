import { describe, expect, it } from "vitest";
import { nextRecurringDate, recurrenceOccursOn, recurringDates } from "@/lib/schedule/recurrence";

describe("calendar and task recurrence", () => {
  it("expands daily and weekly series from their trusted start date", () => {
    expect(recurringDates("2030-01-07", "daily", "2030-01-06", "2030-01-10")).toEqual([
      "2030-01-07",
      "2030-01-08",
      "2030-01-09",
      "2030-01-10",
    ]);
    expect(recurringDates("2030-01-07", "weekly", "2030-01-01", "2030-01-31")).toEqual([
      "2030-01-07",
      "2030-01-14",
      "2030-01-21",
      "2030-01-28",
    ]);
  });

  it("keeps monthly and yearly occurrences on their original calendar day", () => {
    expect(recurrenceOccursOn("2030-01-15", "2030-03-15", "monthly")).toBe(true);
    expect(recurrenceOccursOn("2030-01-15", "2030-03-14", "monthly")).toBe(false);
    expect(recurrenceOccursOn("2030-04-09", "2032-04-09", "yearly")).toBe(true);
  });

  it("finds the next task occurrence without treating an older completion as current", () => {
    expect(nextRecurringDate("2030-01-07", "weekly", "2030-01-09")).toBe("2030-01-14");
    expect(nextRecurringDate("2030-01-07", "daily", "2030-01-09")).toBe("2030-01-09");
  });
});
