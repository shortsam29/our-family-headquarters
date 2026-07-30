import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { householdLocalDateTimeToIso } from "@/lib/schedule/event-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toZonedDateIso } from "@/lib/today/date";

export const kenzieActionProposalSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("create_calendar_event"), title: z.string().trim().min(1).max(160), date: z.iso.date(), time: z.string().regex(/^\d{2}:\d{2}$/) }),
  z.object({ kind: z.literal("save_meal"), name: z.string().trim().min(1).max(160), mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]), date: z.iso.date() }),
]);
export type KenzieActionProposal = z.infer<typeof kenzieActionProposalSchema>;

export type KenzieActionResponse = {
  message: string;
  status: "proposal" | "completed" | "failed";
  proposal?: KenzieActionProposal;
};

function mondayIso(dateValue: string) {
  const value = new Date(`${dateValue}T12:00:00`);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function detectKenzieAction(message: string): KenzieActionProposal | { kind: "add_shopping_item"; name: string; listType: "grocery" | "household" } | { kind: "complete_own_chore"; title: string } | null {
  const shopping = message.match(/\badd\s+(.+?)\s+to\s+(?:the\s+)?(grocery|shopping)(?:\s+list)?[.!]?$/i);
  if (shopping) return { kind: "add_shopping_item", name: shopping[1].trim(), listType: shopping[2].toLowerCase() === "grocery" ? "grocery" : "household" };
  const calendar = message.match(/\bschedule\s+(.+?)\s+on\s+(\d{4}-\d{2}-\d{2})\s+at\s+(\d{2}:\d{2})[.!]?$/i);
  if (calendar) return { kind: "create_calendar_event", title: calendar[1].trim(), date: calendar[2], time: calendar[3] };
  const meal = message.match(/\bplan\s+(breakfast|lunch|dinner|snack)\s+(.+?)\s+on\s+(\d{4}-\d{2}-\d{2})[.!]?$/i);
  if (meal) return { kind: "save_meal", mealType: meal[1].toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack", name: meal[2].trim(), date: meal[3] };
  const chore = message.match(/\bmark\s+(.+?)\s+(?:chore\s+)?(?:complete|done)[.!]?$/i);
  if (chore) return { kind: "complete_own_chore", title: chore[1].trim() };
  return null;
}

export async function executeKenzieProposal(context: CurrentHouseholdContext, raw: unknown): Promise<KenzieActionResponse> {
  const proposal = kenzieActionProposalSchema.safeParse(raw);
  if (!proposal.success) return { status: "failed", message: "That action request was not valid." };
  if (!["household_manager", "parent"].includes(context.role)) return { status: "failed", message: "A parent or household manager needs to make that change." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "failed", message: "The household service is unavailable right now." };
  if (proposal.data.kind === "create_calendar_event") {
    const startsAt = householdLocalDateTimeToIso(proposal.data.date, proposal.data.time, context.timeZone);
    const { error } = await supabase.from("schedule_events").insert({
      household_id: context.householdId,
      created_by_member_id: context.familyMemberId,
      title: proposal.data.title,
      category: "family",
      is_all_day: false,
      starts_at: startsAt,
      ends_at: new Date(new Date(startsAt).getTime() + 3600000).toISOString(),
    });
    if (error) return { status: "failed", message: "The event could not be saved." };
    revalidatePath("/schedule");
    return { status: "completed", message: "The event was added to the household calendar." };
  }
  const { data: plan, error: planError } = await supabase.from("meal_plans").upsert({
    household_id: context.householdId,
    week_start: mondayIso(proposal.data.date),
    created_by_member_id: context.familyMemberId,
  }, { onConflict: "household_id,week_start" }).select("id").single();
  if (planError || !plan) return { status: "failed", message: "The meal plan could not be updated." };
  const { error } = await supabase.from("meal_plan_entries").upsert({
    household_id: context.householdId,
    meal_plan_id: plan.id,
    planned_date: proposal.data.date,
    meal_type: proposal.data.mealType,
    name: proposal.data.name,
    status: "planned",
  }, { onConflict: "meal_plan_id,planned_date,meal_type" });
  if (error) return { status: "failed", message: "The meal plan could not be updated." };
  revalidatePath("/meals");
  return { status: "completed", message: "The meal was saved to the family meal plan." };
}

export async function handleImmediateKenzieAction(context: CurrentHouseholdContext, message: string): Promise<KenzieActionResponse | null> {
  const action = detectKenzieAction(message);
  if (!action) return null;
  if (action.kind === "create_calendar_event" || action.kind === "save_meal") {
    if (!["household_manager", "parent"].includes(context.role)) {
      return { status: "failed", message: "A parent or household manager needs to make that change." };
    }
    const parsed = kenzieActionProposalSchema.safeParse(action);
    return parsed.success ? { status: "proposal", proposal: parsed.data, message: action.kind === "create_calendar_event" ? `Create “${action.title}” on ${action.date} at ${action.time}?` : `Save ${action.name} as ${action.mealType} on ${action.date}?` } : { status: "failed", message: "Please check the date and details." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "failed", message: "The household service is unavailable right now." };
  if (action.kind === "add_shopping_item") {
    const listName = action.listType === "grocery" ? "Grocery List" : "Household Shopping List";
    const { data: list, error: listError } = await supabase.from("shopping_lists").upsert({
      household_id: context.householdId,
      name: listName,
      list_type: action.listType,
      created_by_member_id: context.familyMemberId,
    }, { onConflict: "household_id,name,list_type" }).select("id").single();
    if (listError || !list) return { status: "failed", message: "The shopping list is unavailable." };
    const { error } = await supabase.from("shopping_list_items").insert({
      household_id: context.householdId,
      shopping_list_id: list.id,
      name: action.name,
      status: "needed",
      priority: "normal",
      added_by_member_id: context.familyMemberId,
    });
    if (error) return { status: "failed", message: "The item could not be added." };
    revalidatePath("/shopping");
    return { status: "completed", message: `${action.name} was added to the ${action.listType} list.` };
  }
  const { data: assignment } = await supabase.from("task_assignments")
    .select("id,tasks!inner(title,category,active)")
    .eq("family_member_id", context.familyMemberId)
    .eq("tasks.category", "chore")
    .eq("tasks.active", true)
    .ilike("tasks.title", action.title)
    .limit(1)
    .maybeSingle();
  if (!assignment) return { status: "failed", message: "I could not find that chore in your own active chores." };
  const { error } = await supabase.from("task_completions").upsert({
    task_assignment_id: assignment.id,
    completion_date: toZonedDateIso(new Date(), context.timeZone),
    completed_by_member_id: context.familyMemberId,
  }, { onConflict: "task_assignment_id,completion_date" });
  if (error) return { status: "failed", message: "The chore could not be completed." };
  revalidatePath("/my-headquarters");
  revalidatePath("/tasks");
  return { status: "completed", message: `${action.title} was marked complete.` };
}
