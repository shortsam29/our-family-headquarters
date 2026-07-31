import { describe, expect, it } from "vitest";
import { formatScheduleDate, splitPersonalSchedule } from "@/lib/data/personal-schedule";
import type { ScheduleEvent } from "@/types/features";

const event = (id: string, date: string, startTime = "10:00"): ScheduleEvent => ({
  id,
  title: id,
  date,
  startTime,
  allDay: false,
  category: "appointment",
  ownerId: "11111111-1111-4111-8111-111111111111",
  participantIds: [],
  scope: "household",
});

describe("personal schedule", () => {
  it("separates the current day from future events and omits past events", () => {
    const result = splitPersonalSchedule(
      {
        status: "populated",
        data: [
          event("future-two", "2026-08-05"),
          event("past", "2026-07-29"),
          event("today", "2026-07-30"),
          event("future-one", "2026-07-31"),
        ],
      },
      "2026-07-30",
    );

    expect(result.today).toMatchObject({ status: "populated", data: [{ id: "today" }] });
    expect(result.upcoming).toMatchObject({
      status: "populated",
      data: [{ id: "future-one" }, { id: "future-two" }],
    });
  });

  it("returns independent empty states when today or upcoming has no events", () => {
    const result = splitPersonalSchedule(
      { status: "populated", data: [event("future", "2026-08-05")] },
      "2026-07-30",
    );

    expect(result.today).toEqual({ status: "empty" });
    expect(result.upcoming.status).toBe("populated");
  });

  it("preserves schedule failures for both sections", () => {
    const result = splitPersonalSchedule({ status: "error", message: "unavailable" }, "2026-07-30");
    expect(result.today).toEqual({ status: "error", message: "unavailable" });
    expect(result.upcoming).toEqual({ status: "error", message: "unavailable" });
  });

  it("formats a calendar date without shifting its day", () => {
    expect(formatScheduleDate("2026-07-31")).toBe("Fri, Jul 31, 2026");
  });
});
