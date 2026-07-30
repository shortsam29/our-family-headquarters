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

  it.each([
    ["Put eggs on the grocery list.", "eggs"],
    ["We need bread.", "bread"],
    ["Can you add apples?", "apples"],
  ])("understands natural shopping request: %s", (message, name) => {
    expect(detectKenzieAction(message)).toMatchObject({ kind: "add_shopping_item", name });
  });

  it("understands relative calendar, meal, and chore requests", () => {
    const now = new Date("2030-01-07T12:00:00");
    expect(detectKenzieAction("Schedule soccer practice Tuesday at 5 pm.", now)).toEqual({
      kind: "create_calendar_event",
      title: "soccer practice",
      date: "2030-01-08",
      time: "17:00",
    });
    expect(detectKenzieAction("Add a dentist appointment Friday morning.", now)).toEqual({
      kind: "create_calendar_event",
      title: "a dentist appointment",
      date: "2030-01-11",
      time: "09:00",
    });
    expect(detectKenzieAction("Plan spaghetti for Friday.", now)).toEqual({
      kind: "save_meal",
      mealType: "dinner",
      name: "spaghetti",
      date: "2030-01-11",
    });
    expect(detectKenzieAction("I finished taking out the trash.")).toEqual({
      kind: "complete_own_chore",
      title: "take out the trash",
    });
    expect(detectKenzieAction("I completed doing the dishes.")).toEqual({
      kind: "complete_own_chore",
      title: "do the dishes",
    });
  });

  it("asks for one missing calendar detail instead of guessing", () => {
    expect(detectKenzieAction("Add dentist appointment Friday.")).toEqual({
      kind: "clarification",
      message: "What time should I use for that calendar event?",
    });
  });

  it("interprets direct note and one-time reminder requests as controlled proposals", () => {
    const now = new Date("2030-01-07T12:00:00");
    expect(detectKenzieAction("Leave Robbie a note that practice is tomorrow.")).toEqual({
      kind: "create_note_request",
      recipientSearch: "Robbie",
      message: "practice is tomorrow",
    });
    expect(detectKenzieAction("Remind me Friday at 4 pm to start dinner.", now)).toEqual({
      kind: "create_reminder_request",
      recipientSearch: "me",
      message: "start dinner",
      date: "2030-01-11",
      time: "16:00",
    });
    expect(detectKenzieAction("Remind me every day at 7 am to pack my school bag.", now)).toEqual({
      kind: "create_reminder_request",
      recipientSearch: "me",
      message: "pack my school bag",
      date: "2030-01-07",
      time: "07:00",
      recurrence: "daily",
    });
  });

  it("routes chore-changing requests to the protected boundary", () => {
    expect(detectKenzieAction("Skip my trash chore today")).toEqual({ kind: "blocked_chore_change" });
    expect(detectKenzieAction("Reassign this chore to someone else")).toEqual({ kind: "blocked_chore_change" });
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
