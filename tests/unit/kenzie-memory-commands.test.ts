import { describe, expect, it } from "vitest";
import { detectMemoryCommand } from "@/lib/kenzie/memory/commands";

describe("natural memory controls", () => {
  it.each([
    ["What do you remember about me?", { kind: "list" }],
    ["Forget that I like mushrooms.", { kind: "forget_one", search: "I like mushrooms" }],
    ["Forget my reminder preference.", { kind: "forget_one", search: "reminder preference" }],
    ["Forget everything about me.", { kind: "forget_all" }],
    ["Forget everything.", { kind: "forget_all" }],
    ["Stop remembering things.", { kind: "pause" }],
    ["Start remembering things again.", { kind: "resume" }],
    ["Don't remember this message.", { kind: "skip_message" }],
    ["Don't save anything from this conversation.", { kind: "pause_conversation" }],
  ])("maps %s deterministically", (message, expected) => {
    expect(detectMemoryCommand(message)).toEqual(expected);
  });

  it("does not reinterpret ordinary chat as a memory command", () => {
    expect(detectMemoryCommand("Help me write a story.")).toBeNull();
  });
});
