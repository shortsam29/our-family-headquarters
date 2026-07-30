import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { resolveAuthenticatedMemberProfile } from "@/lib/kenzie/profiles/association";
import type { KenzieContextProvider } from "@/lib/kenzie/platform/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const householdProvider: KenzieContextProvider = {
  id: "household",
  async load(context) {
    return {
      status: "available",
      data: { householdName: context.householdName, timeZone: context.timeZone },
    };
  },
};

export const memberProvider: KenzieContextProvider = {
  id: "member",
  async load(context) {
    const profile = await resolveAuthenticatedMemberProfile(context);
    return {
      status: "available",
      data: { profileKey: profile.key, role: context.role },
    };
  },
};

export const permissionProvider: KenzieContextProvider = {
  id: "permissions",
  async load(context) {
    const administrative = context.role === "household_manager" || context.role === "parent";
    return {
      status: "available",
      data: {
        canManageHousehold: administrative,
        canManageOtherMembers: administrative,
        canActForSelf: true,
      },
    };
  },
};

function dateRange(days = 7) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + days * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const calendarProvider: KenzieContextProvider = {
  id: "calendar",
  async load(context) {
    if (context.source !== "supabase") return { status: "forbidden" };
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { status: "unavailable" };
    const range = dateRange();
    const { data, error } = await supabase
      .from("schedule_events")
      .select("title,starts_at,ends_at,all_day_date,is_all_day,location")
      .eq("household_id", context.householdId)
      .is("cancelled_at", null)
      .or(`starts_at.gte.${range.from},all_day_date.gte.${range.from.slice(0, 10)}`)
      .or(`starts_at.lt.${range.to},all_day_date.lt.${range.to.slice(0, 10)}`)
      .order("starts_at", { ascending: true })
      .limit(20);
    if (error) return { status: "unavailable" };
    return { status: "available", data: { upcoming: data ?? [] } };
  },
};

export const choreProvider: KenzieContextProvider = {
  id: "chores",
  async load(context) {
    if (context.source !== "supabase") return { status: "forbidden" };
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { status: "unavailable" };
    const { data, error } = await supabase
      .from("task_assignments")
      .select("id,tasks!inner(title,due_date,due_time,category,active),task_completions(completion_date)")
      .eq("family_member_id", context.familyMemberId)
      .eq("tasks.active", true)
      .eq("tasks.category", "chore")
      .limit(20);
    if (error) return { status: "unavailable" };
    return { status: "available", data: { assignedToCurrentMember: data ?? [] } };
  },
};

export const shoppingProvider: KenzieContextProvider = {
  id: "shopping",
  async load(context) {
    if (context.source !== "supabase") return { status: "forbidden" };
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { status: "unavailable" };
    const { data, error } = await supabase
      .from("shopping_list_items")
      .select("name,quantity,unit,category,shopping_lists!inner(list_type)")
      .eq("household_id", context.householdId)
      .eq("status", "needed")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return { status: "unavailable" };
    return { status: "available", data: { needed: data ?? [] } };
  },
};

export const mealProvider: KenzieContextProvider = {
  id: "meals",
  async load(context) {
    if (context.source !== "supabase") return { status: "forbidden" };
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { status: "unavailable" };
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("meal_plan_entries")
      .select("name,meal_type,planned_date,status")
      .eq("household_id", context.householdId)
      .gte("planned_date", from)
      .lt("planned_date", to)
      .order("planned_date")
      .limit(28);
    if (error) return { status: "unavailable" };
    return { status: "available", data: { planned: data ?? [] } };
  },
};

export async function assembleKenziePlatformContext(
  context: CurrentHouseholdContext,
  providers: KenzieContextProvider[],
) {
  const assembled: Record<string, Record<string, unknown>> = {};
  for (const provider of providers) {
    let result;
    try {
      result = await provider.load(context);
    } catch {
      result = { status: "unavailable" as const };
    }
    if (result.status === "available") assembled[provider.id] = result.data;
  }
  return assembled;
}
