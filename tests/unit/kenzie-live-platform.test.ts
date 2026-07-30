import { describe, expect, it } from "vitest";
import { detectKenzieAction, kenzieActionProposalSchema } from "@/lib/kenzie/platform/live-actions";
import { selectRelevantProviders } from "@/lib/kenzie/platform/relevance";

describe("Kenzie context relevance", () => {
  it.each([
    ["What is on our calendar tomorrow?", ["calendar"]],
    ["What chores do I have?", ["chores"]],
    ["What is on the grocery list?", ["shopping"]],
    ["What meals are planned this week?", ["meals"]],
  ])("selects minimum household context for %s", (message, expected) => {
    expect(selectRelevantProviders(message).map((provider) => provider.id)).toEqual(expected);
  });

  it.each([
    "Help me understand fractions",
    "Write a story about a dragon",
    "Explain photosynthesis",
  ])("does not load household data for a general question", (message) => {
    expect(selectRelevantProviders(message)).toEqual([]);
  });
});

describe("Kenzie live action boundary", () => {
  it("detects only approved deterministic action forms", () => {
    expect(detectKenzieAction("Add milk to the grocery list")).toEqual({
      kind: "add_shopping_item",
      name: "milk",
      listType: "grocery",
    });
    expect(detectKenzieAction("Change my role to manager")).toBeNull();
  });

  it("requires confirmation-compatible structured calendar and meal proposals", () => {
    expect(kenzieActionProposalSchema.safeParse({
      kind: "create_calendar_event",
      title: "Practice",
      date: "2030-01-02",
      time: "17:00",
    }).success).toBe(true);
    expect(kenzieActionProposalSchema.safeParse({
      kind: "create_calendar_event",
      title: "Practice",
      date: "not-a-date",
      time: "later",
      householdId: "browser-value",
    }).success).toBe(false);
  });
});
