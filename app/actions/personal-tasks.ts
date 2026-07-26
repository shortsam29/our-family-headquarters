"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const personalTaskSchema = z.object({
  title: z.string().trim().min(1, "Please add a task name.").max(160),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.union([z.literal(""), z.iso.date()]),
  dueTime: z.string().regex(/^$|^\d{2}:\d{2}$/),
  category: z.enum(["chore", "homework", "routine", "personal"]),
  priority: z.enum(["low", "normal", "high"]),
});

export type PersonalTaskState = { ok: boolean; message: string };

export async function savePersonalTask(
  _previous: PersonalTaskState,
  formData: FormData,
): Promise<PersonalTaskState> {
  const parsed = personalTaskSchema.safeParse({
    title: formData.get("title"),
    description: String(formData.get("description") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    dueTime: String(formData.get("dueTime") ?? ""),
    category: formData.get("category"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the task details and try again." };

  const context = await requireCurrentHouseholdContext();
  if (context.source === "development-fixture") return { ok: true, message: "Your task was added." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Tasks are temporarily unavailable." };

  const value = parsed.data;
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      household_id: context.householdId,
      created_by_member_id: context.familyMemberId,
      title: value.title,
      description: value.description || null,
      category: value.category,
      scope: "member",
      due_date: value.dueDate || null,
      due_time: value.dueTime || null,
      priority: value.priority,
      recurrence: null,
      active: true,
      archived_at: null,
    })
    .select("id")
    .single();
  if (taskError || !task) return { ok: false, message: "Your task could not be added. Please try again." };

  const { error: assignmentError } = await supabase.from("task_assignments").insert({
    task_id: task.id,
    family_member_id: context.familyMemberId,
    assigned_by_member_id: context.familyMemberId,
  });
  if (assignmentError) {
    await supabase.from("tasks").delete().eq("id", task.id).eq("created_by_member_id", context.familyMemberId);
    return { ok: false, message: "Your task could not be added. Please try again." };
  }

  revalidatePath("/my-headquarters");
  revalidatePath("/my-day");
  revalidatePath("/tasks");
  revalidatePath("/kenzie");
  return { ok: true, message: "Your task was added to your list." };
}