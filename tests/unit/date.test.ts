import { describe, expect, it } from "vitest";
import { formatLocalDate, millisecondsUntilNextLocalDay, toLocalDateIso } from "@/lib/today/date";

describe("Today date utilities", () => {
  it("formats a readable date for an explicit locale", () => {
    expect(formatLocalDate(new Date(2026, 6, 23), "en-US")).toBe("Thursday, July 23, 2026");
  });

  it("creates a machine-readable local date", () => {
    expect(toLocalDateIso(new Date(2026, 6, 3))).toBe("2026-07-03");
  });

  it("calculates the next local day boundary", () => {
    expect(millisecondsUntilNextLocalDay(new Date(2026, 6, 23, 23, 59, 59))).toBe(1000);
  });
});
