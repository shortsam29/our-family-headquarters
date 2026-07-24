import { describe, expect, it } from "vitest";
import {
  formatLocalDate,
  millisecondsUntilNextLocalDay,
  toLocalDateIso,
  toZonedDateIso,
} from "@/lib/today/date";

describe("Today date utilities", () => {
  it("formats a readable date for an explicit locale", () => {
    expect(formatLocalDate(new Date(2026, 6, 23), "en-US")).toBe("Thursday, July 23, 2026");
  });

  it("creates a machine-readable local date", () => {
    expect(toLocalDateIso(new Date(2026, 10, 23))).toBe("2026-11-23");
  });

  it("pads a single-digit month", () => {
    expect(toLocalDateIso(new Date(2026, 0, 23))).toBe("2026-01-23");
  });

  it("pads a single-digit day", () => {
    expect(toLocalDateIso(new Date(2026, 10, 3))).toBe("2026-11-03");
  });

  it("does not depend on the formatted en-CA string order", () => {
    expect(toZonedDateIso(new Date("2026-07-23T16:00:00Z"), "America/New_York", "en-CA")).toBe("2026-07-23");
  });

  it("preserves the local calendar day near time-zone boundaries", () => {
    const instant = new Date("2026-07-23T01:30:00Z");

    expect(toZonedDateIso(instant, "America/New_York")).toBe("2026-07-22");
    expect(toZonedDateIso(instant, "Asia/Tokyo")).toBe("2026-07-23");
  });

  it("always returns the database ISO date shape", () => {
    expect(toZonedDateIso(new Date("2026-01-03T12:00:00Z"), "UTC")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("calculates the next local day boundary", () => {
    expect(millisecondsUntilNextLocalDay(new Date(2026, 6, 23, 23, 59, 59))).toBe(1000);
  });
});
