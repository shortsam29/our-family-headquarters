"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toZonedDateIso } from "@/lib/today/date";

const memoryCategories = ["favorite_meal","disliked_meal","allergy","family_tradition","vacation","birthday","anniversary","grocery_store","shopping_habit","school_schedule","work_schedule","morning_routine","bedtime_routine","trash_day","cleaning_schedule","vehicle_preference","pet_routine","holiday_tradition","favorite_activity","family_note"] as const;
function canManage(role: string) { return role === "household_manager" || role === "parent"; }

export async function saveHouseholdMemory(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/kenzie?error=permission");
  const parsed = z.object({ id: z.uuid().optional(), category: z.enum(memoryCategories), label: z.string().trim().min(1).max(120), value: z.string().trim().min(1).max(2000), visibility: z.enum(["household","adults"]) }).safeParse({
    id: formData.get("id") || undefined, category: formData.get("category"), label: formData.get("label"),
    value: formData.get("value"), visibility: formData.get("visibility"),
  });
  if (!parsed.success) redirect("/kenzie?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/kenzie?error=service");
  const payload = { household_id: context.householdId, category: parsed.data.category, label: parsed.data.label, value: parsed.data.value, visibility: parsed.data.visibility, created_by_member_id: context.familyMemberId };
  const { error } = parsed.data.id
    ? await supabase.from("household_memories").update(payload).eq("id", parsed.data.id).eq("household_id", context.householdId)
    : await supabase.from("household_memories").insert(payload);
  if (error) redirect("/kenzie?error=save");
  revalidatePath("/kenzie"); revalidatePath("/");
  redirect("/kenzie?status=memory-saved");
}

export async function deleteHouseholdMemory(id: string) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role) || !z.uuid().safeParse(id).success) redirect("/kenzie?error=permission");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/kenzie?error=service");
  const { error } = await supabase.from("household_memories").delete().eq("id", id).eq("household_id", context.householdId);
  if (error) redirect("/kenzie?error=save");
  revalidatePath("/kenzie"); redirect("/kenzie?status=memory-removed");
}

export async function saveKenziePreferences(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/kenzie?error=permission");
  const parsed = z.object({
    greetingStyle: z.enum(["warm","brief","playful"]), reminderStyle: z.enum(["gentle","direct","minimal"]),
    planningBehavior: z.enum(["minimal","balanced","detailed"]),
  }).safeParse({ greetingStyle: formData.get("greetingStyle"), reminderStyle: formData.get("reminderStyle"), planningBehavior: formData.get("planningBehavior") });
  if (!parsed.success) redirect("/kenzie?error=validation");
  const on = (name: string) => formData.get(name) === "on";
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/kenzie?error=service");
  const { error } = await supabase.from("kenzie_preferences").upsert({
    household_id: context.householdId, greeting_style: parsed.data.greetingStyle,
    reminder_style: parsed.data.reminderStyle, planning_behavior: parsed.data.planningBehavior,
    morning_briefing: on("morningBriefing"), evening_recap: on("eveningRecap"),
    meal_reminders: on("meals"), shopping_reminders: on("shopping"), pet_reminders: on("pets"),
    vehicle_reminders: on("vehicles"), finance_reminders: on("finance"),
    birthday_reminders: on("birthdays"), holiday_reminders: on("holidays"),
    document_reminders: on("documents"), updated_by_member_id: context.familyMemberId,
  });
  if (error) redirect("/kenzie?error=save");
  revalidatePath("/kenzie"); redirect("/kenzie?status=preferences-saved");
}

export type PlanApprovalState = { ok: boolean; message: string };
export async function approveTomorrowPlan(_: PlanApprovalState, formData: FormData): Promise<PlanApprovalState> {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) return { ok: false, message: "Only a parent or household manager can approve tomorrow." };
  let raw: unknown;
  try { raw = JSON.parse(String(formData.get("items") ?? "[]")); } catch { return { ok: false, message: "The proposal could not be read." }; }
  const parsed = z.array(z.object({ category: z.string().min(1).max(80), title: z.string().trim().min(1).max(300) })).min(1).max(50).safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Add at least one clear item before approving tomorrow." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Tomorrow planning is temporarily unavailable." };
  const today = toZonedDateIso(new Date(), context.timeZone);
  const tomorrow = new Date(`${today}T12:00:00Z`); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const planDate = tomorrow.toISOString().slice(0, 10);
  const { error } = await supabase.from("kenzie_tomorrow_plans").upsert({
    household_id: context.householdId, plan_date: planDate, items: parsed.data,
    status: "approved", approved_by_member_id: context.familyMemberId, approved_at: new Date().toISOString(),
  }, { onConflict: "household_id,plan_date" });
  if (error) return { ok: false, message: "Tomorrow was not saved. Please review the proposal and try again." };
  revalidatePath("/kenzie");
  return { ok: true, message: "Tomorrow is ready whenever you are. ❤️ Kenzie" };
}
