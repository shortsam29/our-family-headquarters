import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { getCurrentMemberTasks, getScheduleData } from "@/lib/data/core";
import { getDomainSignals } from "@/lib/data/domains";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createKenzieNote } from "@/lib/kenzie/intelligence";

export type HouseholdMemory = {
  id: string;
  category: string;
  label: string;
  value: string;
  visibility: "household" | "adults";
};

export type KenziePreferences = {
  greetingStyle: "warm" | "brief" | "playful";
  reminderStyle: "gentle" | "direct" | "minimal";
  morningBriefing: boolean;
  eveningRecap: boolean;
  planningBehavior: "minimal" | "balanced" | "detailed";
  reminders: Record<string, boolean>;
};

export const defaultKenziePreferences: KenziePreferences = {
  greetingStyle: "warm", reminderStyle: "gentle", morningBriefing: true, eveningRecap: true,
  planningBehavior: "balanced",
  reminders: { meals: true, shopping: true, pets: true, vehicles: true, finance: true, birthdays: true, holidays: true, documents: true },
};

export function buildPriorityObservations(input: {
  scheduleCount: number; taskCount: number; completedCount: number; dinner?: string;
  shopping: number; bills: number; documents: number; petCare: number; vehicleCare: number;
}) {
  const observations: Array<{ score: number; title: string; message: string; recommendation?: string }> = [];
  if (input.scheduleCount >= 4) observations.push({ score: 90, title: "A full day", message: `${input.scheduleCount} plans are sharing the day. Leave a little room between them.`, recommendation: "Consider preparing bags, papers, or equipment tonight." });
  if (!input.dinner) observations.push({ score: 82, title: "Dinner is still open", message: "Nothing is planned for dinner yet.", recommendation: "A simple favorite meal could give tomorrow one less decision." });
  if (input.petCare) observations.push({ score: 78, title: "Pet care ahead", message: `${input.petCare} pet ${input.petCare === 1 ? "reminder is" : "reminders are"} approaching.`, recommendation: "Review the care reminder when the evening feels calm." });
  if (input.vehicleCare) observations.push({ score: 76, title: "Vehicle care ahead", message: `${input.vehicleCare} vehicle ${input.vehicleCare === 1 ? "reminder is" : "reminders are"} approaching.`, recommendation: "Check the due date before the week becomes busy." });
  if (input.documents) observations.push({ score: 74, title: "A document needs review", message: `${input.documents} ${input.documents === 1 ? "document has" : "documents have"} a date approaching.`, recommendation: "Review the Family Vault when you have a quiet moment." });
  if (input.bills) observations.push({ score: 72, title: "A household obligation is coming up", message: `${input.bills} ${input.bills === 1 ? "item is" : "items are"} due within the next month.`, recommendation: "Review upcoming obligations without handling everything at once." });
  if (input.shopping >= 5) observations.push({ score: 68, title: "The shopping list is growing", message: `${input.shopping} items are waiting across the household lists.`, recommendation: "Consider choosing a shopping time before the list gets longer." });
  if (input.taskCount && input.completedCount === input.taskCount) observations.push({ score: 55, title: "Today’s list is complete", message: `${input.completedCount} ${input.completedCount === 1 ? "responsibility is" : "responsibilities are"} finished. The progress is worth noticing.` });
  return observations.sort((a, b) => b.score - a.score).slice(0, 4);
}

export async function getKenzieDashboard(context: CurrentHouseholdContext) {
  const [schedule, tasks, signals] = await Promise.all([getScheduleData(context), getCurrentMemberTasks(context), getDomainSignals(context)]);
  const supabase = await createSupabaseServerClient();
  let memories: HouseholdMemory[] = [];
  let preferences = defaultKenziePreferences;
  let accomplishments = 0;
  let approvedPlan: { planDate: string; items: Array<{ category: string; title: string }> } | undefined;
  if (supabase && context.source === "supabase") {
    const [memoryResult, preferenceResult, completionResult, planResult] = await Promise.all([
      supabase.from("household_memories").select("id,category,label,value,visibility").eq("household_id", context.householdId).order("category"),
      supabase.from("kenzie_preferences").select("*").eq("household_id", context.householdId).maybeSingle(),
      supabase.from("task_completions").select("id", { count: "exact", head: true }).gte("completed_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from("kenzie_tomorrow_plans").select("plan_date,items").eq("household_id", context.householdId).eq("status", "approved").order("plan_date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    memories = (memoryResult.data ?? []).map((row) => ({ id: row.id, category: row.category, label: row.label, value: row.value, visibility: row.visibility as HouseholdMemory["visibility"] }));
    if (preferenceResult.data) {
      const row = preferenceResult.data;
      preferences = {
        greetingStyle: row.greeting_style, reminderStyle: row.reminder_style,
        morningBriefing: row.morning_briefing, eveningRecap: row.evening_recap,
        planningBehavior: row.planning_behavior,
        reminders: { meals: row.meal_reminders, shopping: row.shopping_reminders, pets: row.pet_reminders, vehicles: row.vehicle_reminders, finance: row.finance_reminders, birthdays: row.birthday_reminders, holidays: row.holiday_reminders, documents: row.document_reminders },
      };
    }
    accomplishments = completionResult.count ?? 0;
    if (planResult.data) approvedPlan = { planDate: planResult.data.plan_date, items: planResult.data.items as Array<{ category: string; title: string }> };
  }
  const scheduleItems = schedule.status === "populated" ? schedule.data : [];
  const taskItems = tasks.status === "populated" ? tasks.data : [];
  const observations = buildPriorityObservations({
    scheduleCount: scheduleItems.length, taskCount: taskItems.length,
    completedCount: taskItems.filter((item) => item.completed).length, ...signals,
  });
  const note = createKenzieNote({
    audience: context.role === "child" ? "child" : "family",
    scheduledCount: scheduleItems.filter((item) => item.date === "today").length,
    upcomingCount: scheduleItems.filter((item) => item.date !== "today").length,
    assignedCount: taskItems.length, completedCount: taskItems.filter((item) => item.completed).length,
    overdueCount: 0, dinner: signals.meal, shoppingCount: signals.shopping,
    upcomingBillCount: signals.bills, expiringDocumentCount: signals.documents,
    petCareCount: signals.petCare, vehicleCareCount: signals.vehicleCare,
  });
  return { memories, preferences, accomplishments, approvedPlan, observations, note, schedule: scheduleItems, tasks: taskItems, signals };
}
