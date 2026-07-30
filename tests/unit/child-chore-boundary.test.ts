import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("child chore boundary", () => {
  it("enforces reopen permission on the server and hides it from regular members", () => {
    const action = readFileSync("app/actions/tasks.ts", "utf8");
    const manager = readFileSync("components/tasks/TaskManager.tsx", "utf8");
    expect(action).toContain('!completed&&!["household_manager","parent"].includes(context.role)');
    expect(manager).toContain("t.assigneeId===currentMemberId&&(!t.completed||canManage)");
  });
});
