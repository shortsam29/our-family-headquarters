import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const action = readFileSync("app/actions/personal-tasks.ts", "utf8");
const page = readFileSync("app/(main)/my-headquarters/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260727030000_personal_task_self_assignment.sql", "utf8");
const completionAction = readFileSync("app/actions/tasks.ts", "utf8");
const managedTasks = readFileSync("lib/data/tasks.ts", "utf8");
const taskManager = readFileSync("components/tasks/TaskManager.tsx", "utf8");

describe("personal task self-service", () => {
  it("places self-service creation in My Headquarters", () => {
    expect(page).toContain("<PersonalTaskForm today={today} />");
    expect(page).toContain("setTaskCompletion");
  });

  it("always assigns a personal task to the current member", () => {
    expect(action).toContain('scope: "member"');
    expect(action).toContain("family_member_id: context.familyMemberId");
    expect(action).toContain("assigned_by_member_id: context.familyMemberId");
    expect(action).not.toContain('formData.get("assigneeId")');
  });

  it("allows only a member's own newly created assignment", () => {
    expect(migration).toContain("family_member_id = assigned_by_member_id");
    expect(migration).toContain("t.created_by_member_id = family_member_id");
    expect(migration).toContain("family_member_id = public.current_family_member_id(t.household_id)");
  });

  it("keeps completion restricted to the signed-in member", () => {
    expect(completionAction).toContain('.eq("family_member_id",context.familyMemberId)');
    expect(completionAction).toContain('completed_by_member_id:context.familyMemberId');
  });

  it("shows managers assigned-task progress but excludes a child's self-created task", () => {
    expect(managedTasks).toContain("a.assigned_by_member_id!==a.family_member_id");
    expect(managedTasks).toContain("a.family_member_id===context.familyMemberId");
    expect(taskManager).toContain('t.completed?"Complete":"Not complete"');
  });});