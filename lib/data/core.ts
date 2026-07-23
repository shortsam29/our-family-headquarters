import { familyMembers, scheduleEvents } from "@/lib/features/mock-data";
import { todayMockData } from "@/lib/today/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import type { FamilyMemberSummary, ScheduleEvent } from "@/types/features";
import type { SectionState, TodayExperienceData, TodayTask } from "@/types/today";

function localDateInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function scheduleDateLabel(value: string, timeZone: string) {
  const today = localDateInTimeZone(timeZone);
  const tomorrowDate = new Date(`${today}T12:00:00Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const eventDate = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  const eventLocalDate = dateOnly
    ? value
    : new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(eventDate);

  if (eventLocalDate === today) return "today";
  if (eventLocalDate === tomorrow) return "tomorrow";
  return new Intl.DateTimeFormat(undefined, { timeZone: dateOnly ? "UTC" : timeZone, weekday: "long" }).format(eventDate);
}

export async function getScheduleData(context: CurrentHouseholdContext): Promise<SectionState<ScheduleEvent[]>> {
  if (context.source === "development-fixture") return { status: "populated", data: scheduleEvents };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const { data, error } = await supabase
    .from("schedule_events")
    .select("id,title,category,location,starts_at,ends_at,all_day_date,is_all_day,created_by_member_id,event_participants(family_member_id)")
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
        date: dateValue ? scheduleDateLabel(dateValue, context.timeZone) : "Date not set",
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

export async function getTodayExperienceData(context: CurrentHouseholdContext): Promise<TodayExperienceData> {
  if (context.source === "development-fixture") return todayMockData;
  const [schedule, tasks] = await Promise.all([getScheduleData(context), getCurrentMemberTasks(context)]);
  const todaySchedule: TodayExperienceData["schedule"] =
    schedule.status === "populated"
      ? { status: "populated", data: schedule.data.slice(0, 3).map((event) => ({ id: event.id, title: event.title, daypart: "Morning" as const, scope: "household" as const })) }
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
    dinner: { status: "empty" },
    familyUpdates: { status: "empty" },
    shopping: { status: "empty" },
    grocery: { status: "empty" },
    inbox: { status: "empty" },
    upcoming: { status: "empty" },
    kenzie: { status: "empty" },
  };
}
