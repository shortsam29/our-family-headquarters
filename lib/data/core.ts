import { familyMembers, scheduleEvents } from "@/lib/features/mock-data";
import { todayMockData } from "@/lib/today/mock-data";
import { createKenzieNote } from "@/lib/kenzie/intelligence";
import { getDomainSignals } from "@/lib/data/domains";
import { nextRecurringDate, recurringDates, type CalendarRecurrence } from "@/lib/schedule/recurrence";
import { toZonedDateIso } from "@/lib/today/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import type { FamilyMemberSummary, ScheduleEvent } from "@/types/features";
import type { KenzieNote, SectionState, TodayExperienceData, TodayTask } from "@/types/today";

function localDateInTimeZone(timeZone: string) {
  return toZonedDateIso(new Date(), timeZone);
}

function localTimeInTimeZone(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toZonedDateIso(date, "UTC");
}

export async function getScheduleData(context: CurrentHouseholdContext): Promise<SectionState<ScheduleEvent[]>> {
  if (context.source === "development-fixture") return { status: "populated", data: scheduleEvents };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const { data, error } = await supabase
    .from("schedule_events")
    .select("id,title,description,category,location,starts_at,ends_at,all_day_date,is_all_day,recurrence,reminder_minutes,created_by_member_id,event_participants(family_member_id)")
    .eq("household_id", context.householdId)
    .is("cancelled_at", null)
    .order("starts_at", { ascending: true });
  if (error) return { status: "error", message: error.code };
  if (!data?.length) return { status: "empty" };
  const baseEvents = data.map((event) => {
      const dateValue = event.is_all_day ? event.all_day_date : event.starts_at;
      const date = dateValue ? (event.is_all_day ? event.all_day_date! : toZonedDateIso(new Date(event.starts_at!), context.timeZone)) : "";
      return {
        id: event.id,
        seriesId: event.id,
        seriesStartDate: date,
        title: event.title,
        date,
        endDate: event.ends_at ? toZonedDateIso(new Date(event.ends_at), context.timeZone) : undefined,
        description: event.description ?? undefined,
        startTime: event.starts_at ? localTimeInTimeZone(event.starts_at, context.timeZone) : undefined,
        endTime: event.ends_at ? localTimeInTimeZone(event.ends_at, context.timeZone) : undefined,
        allDay: event.is_all_day,
        category: event.category,
        ownerId: event.created_by_member_id,
        participantIds: (event.event_participants ?? []).map((participant) => participant.family_member_id),
        location: event.location ?? undefined,
        recurrence: event.recurrence as CalendarRecurrence | undefined,
        reminderMinutes: event.reminder_minutes ?? undefined,
        scope: "household" as const,
      };
    });
  const today = localDateInTimeZone(context.timeZone);
  const fromDate = new Date(`${today}T12:00:00`);
  const toDate = new Date(`${today}T12:00:00`);
  fromDate.setFullYear(fromDate.getFullYear() - 1);
  toDate.setFullYear(toDate.getFullYear() + 2);
  const from = toZonedDateIso(fromDate, "UTC");
  const to = toZonedDateIso(toDate, "UTC");
  const expanded = baseEvents.flatMap((event) => {
    if (!event.recurrence) return [event];
    const durationDays = event.endDate
      ? Math.max(0, Math.round((new Date(`${event.endDate}T12:00:00`).getTime() - new Date(`${event.date}T12:00:00`).getTime()) / 86_400_000))
      : 0;
    return recurringDates(event.date, event.recurrence, from, to).map((date) => ({
      ...event,
      id: `${event.seriesId}:${date}`,
      date,
      endDate: event.endDate ? shiftDate(date, durationDays) : undefined,
    }));
  });
  return {
    status: "populated",
    data: expanded,
  };
}

export async function getCurrentMemberTasks(context: CurrentHouseholdContext): Promise<SectionState<TodayTask[]>> {
  if (context.source === "development-fixture") return todayMockData.tasks;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const today = localDateInTimeZone(context.timeZone);
  const { data, error } = await supabase
    .from("task_assignments")
    .select("id,tasks!inner(title,category,daypart,due_time,due_date,recurrence,active),task_completions(id,completion_date)")
    .eq("family_member_id", context.familyMemberId)
    .eq("tasks.active", true);
  if (error) return { status: "error", message: error.code };
  const current = (data ?? []).filter((assignment) => {
    const task = assignment.tasks as unknown as { due_date: string | null; recurrence: CalendarRecurrence | null };
    if (!task.due_date) return true;
    if (!task.recurrence) return task.due_date === today;
    return nextRecurringDate(task.due_date, task.recurrence, today) === today;
  });
  if (!current.length) return { status: "empty" };
  return {
    status: "populated",
    data: current.map((assignment) => {
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
  includePersonalTasks = true,
): Promise<SectionState<KenzieNote>> {
  if (context.source === "development-fixture") return todayMockData.kenzie;
  const today = localDateInTimeZone(context.timeZone);
  let overdueCount = 0;
  let conversationCount = 0;
  const supabase = await createSupabaseServerClient();
  if (supabase && includePersonalTasks) {
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
  if (supabase) {
    const conversationResult = await supabase.from("family_conversations").select("id", { count: "exact", head: true }).eq("household_id", context.householdId).is("handled_at", null);
    conversationCount = conversationResult.count ?? 0;
  }
  const visibleTasks = includePersonalTasks && tasks.status === "populated" ? tasks.data : [];
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
      shoppingCount: signals.shopping + signals.grocery,
      conversationCount,
      upcomingBillCount: signals.bills,
      expiringDocumentCount: signals.documents,
      petCareCount: signals.petCare,
      vehicleCareCount: signals.vehicleCare,
    }),
  };
}

export async function getTodayExperienceData(context: CurrentHouseholdContext): Promise<TodayExperienceData> {
  if (context.source === "development-fixture") return todayMockData;
  const [schedule, signals] = await Promise.all([getScheduleData(context), getDomainSignals(context)]);
  const personalTasks: SectionState<TodayTask[]> = { status: "empty" };
  const kenzie = await getKenzieGuidance(context, schedule, personalTasks, signals, false);
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
    tasks: personalTasks,
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
    grocery: signals.grocery ? {
      status: "populated",
      data: {
        id: "grocery", kind: "grocery", title: "Grocery List",
        message: "The shared list is ready when the household shops.",
        count: signals.grocery, scope: "household", tone: "blush", symbol: "◌",
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
