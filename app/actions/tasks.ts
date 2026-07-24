"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toZonedDateIso } from "@/lib/today/date";

const toggleSchema = z.object({ assignmentId: z.uuid(), completed: z.boolean() });
export type TaskMutationResult = { ok: true } | { ok: false; message: string };

export async function setTaskCompletion(assignmentId: string, completed: boolean): Promise<TaskMutationResult> {
  const parsed = toggleSchema.safeParse({ assignmentId, completed });
  if (!parsed.success) return { ok: false, message: "That task could not be updated." };
  const context = await requireCurrentHouseholdContext();
  if (context.source === "development-fixture") return { ok: true };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Tasks are temporarily unavailable." };
  const completionDate = toZonedDateIso(new Date(), context.timeZone);
  const { data: assignment } = await supabase
    .from("task_assignments")
    .select("id,family_member_id")
    .eq("id", parsed.data.assignmentId)
    .eq("family_member_id", context.familyMemberId)
    .maybeSingle();
  if (!assignment) return { ok: false, message: "You don’t have permission to update that task." };
  const query = completed
    ? supabase.from("task_completions").upsert({
        task_assignment_id: assignment.id,
        completion_date: completionDate,
        completed_by_member_id: context.familyMemberId,
      }, { onConflict: "task_assignment_id,completion_date" })
    : supabase.from("task_completions").delete()
        .eq("task_assignment_id", assignment.id)
        .eq("completion_date", completionDate);
  const { error } = await query;
  if (error) return { ok: false, message: "That task wasn’t changed. Please try again." };
  revalidatePath("/");
  revalidatePath("/my-day");
  return { ok: true };
}
