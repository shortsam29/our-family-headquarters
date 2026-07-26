import { familyMembers, scheduleEvents } from "@/lib/features/mock-data";
import { todayMockData } from "@/lib/today/mock-data";
import { createKenzieNote } from "@/lib/kenzie/intelligence";
import { getDomainSignals } from "@/lib/data/domains";
import { toZonedDateIso } from "@/lib/today/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import type { FamilyMemberSummary, ScheduleEvent } from "@/types/features";
import type { KenzieNote, SectionState, TodayExperienceData, TodayTask } from "@/types/today";

function localDateInTimeZone(timeZone: string) {
  return toZonedDateIso(new Date(), timeZone);
}

export async function getScheduleData(context: CurrentHouseholdContext): Promise<SectionState<ScheduleEvent[]>> {
  if (context.source === "development-fixture") return { status: "populated", data: scheduleEvents };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const { data, error } = await supabase
    .from("schedule_events")
    .select("id,title,description,category,location,starts_at,ends_at,all_day_date,is_all_day,created_by_member_id,event_participants(family_member_id)")
    .eq("household_id", context.householdId)
    .is("cancelled_at", null)
    .order("starts_at", { ascending: true });
  if (error) return { status: "error", message: error.code };
  if (!data?.length) return { status: "empty" };
  return {
    status: "populated",
    data: data.map((event) => {
      const dateValue = event.is_all_day ? event.all_day_date : event.starts_at;
      return {
        id: event.id,
        title: event.title,
        date: dateValue ? (event.is_all_day ? event.all_day_date! : toZonedDateIso(new Date(event.starts_at!), context.timeZone)) : "",
        endDate: event.ends_at ? toZonedDateIso(new Date(event.ends_at), context.timeZone) : undefined,
        description: event.description ?? undefined,
        startTime: event.starts_at ? new Intl.DateTimeFormat(undefined, { timeZone: context.timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(event.starts_at)) : undefined,
        endTime: event.ends_at ? new Intl.DateTimeFormat(undefined, { timeZone: context.timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(event.ends_at)) : undefined,
        allDay: event.is_all_day,
        category: event.category,
        ownerId: event.created_by_member_id,
        participantIds: (event.event_participants ?? []).map((participant) => participant.family_member_id),
        location: event.location ?? undefined,
        scope: "household" as const,
      };
    }),
  };
}

export async function getCurrentMemberTasks(context: CurrentHouseholdContext): Promise<SectionState<TodayTask[]>> {
  if (context.source === "development-fixture") return todayMockData.tasks;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const today = localDateInTimeZone(context.timeZone);
  const { data, error } = await supabase
    .from("task_assignments")
    .select("id,tasks!inner(title,category,daypart,due_time,due_date,active),task_completions(id,completion_date)")
    .eq("family_member_id", context.familyMemberId)
    .eq("tasks.active", true)
    .or(`due_date.is.null,due_date.eq.${today}`, { referencedTable: "tasks" });
  if (error) return { status: "error", message: error.code };
  if (!data?.length) return { status: "empty" };
  return {
    status: "populated",
    data: data.map((assignment) => {
      const task = assignment.tasks as unknown as {
        title: string;
        category: TodayTask["category"];
        daypart: TodayTask["daypart"] | null;
        due_time: string | null;
      };
      return {
        id: assignment.id,
        title: task.title,
        category: task.category,
        daypart: task.daypart ?? undefined,
        dueTime: task.due_time?.slice(0, 5),
        completed: (assignment.task_completions ?? []).some((completion) => completion.completion_date === today),
        assigneeId: context.familyMemberId,
        scope: "member",
      };
    }),
  };
}

export async function getHouseholdMembers(context: CurrentHouseholdContext): Promise<SectionState<FamilyMemberSummary[]>> {
  if (context.source === "development-fixture") return { status: "populated", data: familyMembers };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const { data, error } = await supabase
    .from("family_members")
    .select("id,display_name,role")
    .eq("household_id", context.householdId)
    .eq("status", "active")
    .order("created_at");
  if (error) return { status: "error", message: error.code };
  if (!data?.length) return { status: "empty" };
  const memberRows = data as Array<{ id: string; display_name: string; role: string }>;
  return {
    status: "populated",
    data: memberRows.map((member) => ({
      id: member.id,
      displayName: member.display_name,
      initials: member.display_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      role: member.role === "child" ? "child" : "adult",
      relationship: member.role.replaceAll("_", " "),
    })),
  };
}

export type ManagedFamilyMember = {
  id: string;
  displayName: string;
  role: CurrentHouseholdContext["role"];
  status: "active" | "inactive" | "archived";
  linkedAccount: boolean;
};

export async function getManagedHouseholdMembers(context: CurrentHouseholdContext): Promise<ManagedFamilyMember[]> {
  if (context.source === "development-fixture") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("family_members")
    .select("id,display_name,role,status,linked_user_id")
    .eq("household_id", context.householdId)
    .order("created_at");
  return (data ?? []).map((member) => ({
    id: member.id,
    displayName: member.display_name,
    role: member.role as ManagedFamilyMember["role"],
    status: member.status as ManagedFamilyMember["status"],
    linkedAccount: Boolean(member.linked_user_id),
  }));
}

export async function getKenzieGuidance(
  context: CurrentHouseholdContext,
  schedule: SectionState<ScheduleEvent[]>,
  tasks: SectionState<TodayTask[]>,
  signals: Awaited<ReturnType<typeof getDomainSignals>>,
): Promise<SectionState<KenzieNote>> {
  if (context.source === "development-fixture") return todayMockData.kenzie;
  const today = localDateInTimeZone(context.timeZone);
  let overdueCount = 0;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("task_assignments")
      .select("tasks!inner(due_date,active),task_completions(completion_date)")
      .eq("family_member_id", context.familyMemberId)
      .eq("tasks.active", true);
    overdueCount = (data ?? []).filter((assignment) => {
      const task = assignment.tasks as unknown as { due_date: string | null };
      return Boolean(task.due_date && task.due_date < today && !(assignment.task_completions ?? []).length);
    }).length;
  }
  const visibleTasks = tasks.status === "populated" ? tasks.data : [];
  const visibleSchedule = schedule.status === "populated" ? schedule.data : [];
  return {
    status: "populated",
    data: createKenzieNote({
      audience: context.role === "child" ? "child" : "family",
      scheduledCount: visibleSchedule.filter((event) => event.date === today).length,
      upcomingCount: visibleSchedule.filter((event) => event.date > today).length,
      assignedCount: visibleTasks.length,
      completedCount: visibleTasks.filter((task) => task.completed).length,
      overdueCount,
      dinner: signals.meal,
      shoppingCount: signals.shopping,
      upcomingBillCount: signals.bills,
      expiringDocumentCount: signals.documents,
      petCareCount: signals.petCare,
      vehicleCareCount: signals.vehicleCare,
    }),
  };
}

export async function getTodayExperienceData(context: CurrentHouseholdContext): Promise<TodayExperienceData> {
  if (context.source === "development-fixture") return todayMockData;
  const [schedule, tasks, signals] = await Promise.all([getScheduleData(context), getCurrentMemberTasks(context), getDomainSignals(context)]);
  const kenzie = await getKenzieGuidance(context, schedule, tasks, signals);
  const todaySchedule: TodayExperienceData["schedule"] =
    schedule.status === "populated"
      ? { status: "populated", data: schedule.data.filter((event) => event.date === localDateInTimeZone(context.timeZone)).slice(0, 3).map((event) => ({ id: event.id, title: event.title, daypart: "Morning" as const, scope: "household" as const })) }
      : schedule.status === "error"
        ? { status: "error", message: schedule.message }
        : { status: schedule.status };
  return {
    currentMember: {
      id: context.familyMemberId,
      displayName: context.displayName,
      initials: context.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      role: context.role === "child" ? "child" : "adult",
    },
    schedule: todaySchedule,
    tasks,
    weather: { status: "empty" },
    dinner: signals.meal ? { status: "populated", data: { id: "tonight", name: signals.meal, scope: "household" } } : { status: "empty" },
    familyUpdates: { status: "empty" },
    shopping: signals.shopping ? {
      status: "populated",
      data: {
        id: "shopping", kind: "shopping", title: "Shopping Lists",
        message: `${signals.shopping} ${signals.shopping === 1 ? "item is" : "items are"} still needed.`,
        count: signals.shopping, scope: "household", tone: "sage", symbol: "◌",
      },
    } : { status: "empty" },
    grocery: signals.shopping ? {
      status: "populated",
      data: {
        id: "grocery", kind: "grocery", title: "Grocery List",
        message: "The shared list is ready when the household shops.",
        count: signals.shopping, scope: "household", tone: "blush", symbol: "◌",
      },
    } : { status: "empty" },
    inbox: { status: "empty" },
    upcoming: signals.petCare + signals.vehicleCare + signals.documents + signals.bills ? {
      status: "populated",
      data: {
        id: "upcoming", kind: "upcoming", title: "Coming Up",
        message: "Household care and renewal reminders are gathered here.",
        count: signals.petCare + signals.vehicleCare + signals.documents + signals.bills,
        scope: "household", tone: "taupe", symbol: "○",
      },
    } : { status: "empty" },
    kenzie,
  };
}

export type HouseholdInvitationSummary = {
  id: string;
  familyMemberId: string;
  status: "active" | "redeemed" | "disabled";
  expiresAt: string;
};

export async function getHouseholdInvitations(context: CurrentHouseholdContext): Promise<HouseholdInvitationSummary[]> {
  if (context.source === "development-fixture" || !["household_manager", "parent"].includes(context.role)) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from("household_invitations").select("id,family_member_id,status,expires_at").eq("household_id", context.householdId).order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({ id: row.id, familyMemberId: row.family_member_id, status: row.status as HouseholdInvitationSummary["status"], expiresAt: row.expires_at }));
}
