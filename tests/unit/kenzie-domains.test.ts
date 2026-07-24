import { describe, expect, it } from "vitest";
import { createKenzieNote } from "@/lib/kenzie/intelligence";

const base = { audience: "adult" as const, scheduledCount: 0, assignedCount: 0, completedCount: 0, overdueCount: 0, upcomingCount: 0 };

describe("Kenzie domain guidance", () => {
  it("prioritizes household care without alarmist language", () => {
    const note = createKenzieNote({ ...base, petCareCount: 1, upcomingBillCount: 2 });
    expect(note.title).toBe("A little care is coming up");
    expect(note.message).toContain("There is time");
  });

  it("keeps restricted finance details out of guidance", () => {
    const note = createKenzieNote({ ...base, upcomingBillCount: 2 });
    expect(note.message).toContain("2 adult household items");
    expect(note.message).not.toMatch(/\$|bill name|account/i);
  });

  it("uses planned dinner and shopping facts deterministically", () => {
    const note = createKenzieNote({ ...base, dinner: "Vegetable pasta", shoppingCount: 3 });
    expect(note.message).toContain("3 items");
    expect(note.message).toContain("Vegetable pasta");
  });
});
