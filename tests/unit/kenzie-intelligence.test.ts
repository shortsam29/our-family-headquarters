import { describe, expect, it } from "vitest";
import { createKenzieNote } from "@/lib/kenzie/intelligence";

describe("Kenzie deterministic guidance", () => {
  it("gives overdue work calm priority", () => {
    const note = createKenzieNote({
      audience: "family",
      scheduledCount: 2,
      assignedCount: 3,
      completedCount: 1,
      overdueCount: 1,
      upcomingCount: 1,
    });
    expect(note.title).toBe("One gentle place to begin");
    expect(note.message).toContain("1 item may need another look");
  });

  it("recognizes a completed list", () => {
    const note = createKenzieNote({
      audience: "child",
      scheduledCount: 1,
      assignedCount: 2,
      completedCount: 2,
      overdueCount: 0,
      upcomingCount: 0,
    });
    expect(note.message).toContain("finished 2 items");
  });

  it("uses schedule context when no tasks are assigned", () => {
    const note = createKenzieNote({
      audience: "family",
      scheduledCount: 1,
      assignedCount: 0,
      completedCount: 0,
      overdueCount: 0,
      upcomingCount: 2,
    });
    expect(note.message).toContain("2 more coming up");
  });
});
