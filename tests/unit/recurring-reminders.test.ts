import { describe, expect, it } from "vitest";
import { nextReminderDueAt } from "@/lib/kenzie/notifications/recurrence";

describe("recurring reminders", () => {
  it("advances daily and weekly reminders while preserving local time", () => {
    expect(nextReminderDueAt("2030-01-07T12:00:00.000Z", "America/New_York", "daily"))
      .toBe("2030-01-08T12:00:00.000Z");
    expect(nextReminderDueAt("2030-01-07T12:00:00.000Z", "America/New_York", "weekly"))
      .toBe("2030-01-14T12:00:00.000Z");
  });
});
