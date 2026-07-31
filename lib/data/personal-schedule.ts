import type { ScheduleEvent } from "@/types/features";
import type { SectionState } from "@/types/today";

export function splitPersonalSchedule(
  schedule: SectionState<ScheduleEvent[]>,
  today: string,
  familyMemberId: string,
): {
  today: SectionState<ScheduleEvent[]>;
  upcoming: SectionState<ScheduleEvent[]>;
} {
  if (schedule.status !== "populated") {
    return { today: schedule, upcoming: schedule };
  }

  const relevant = schedule.data
    .filter((event) => event.date >= today && event.participantIds.includes(familyMemberId))
    .sort((left, right) =>
      `${left.date}T${left.startTime ?? "00:00"}`.localeCompare(
        `${right.date}T${right.startTime ?? "00:00"}`,
      ),
    );
  const todayEvents = relevant.filter((event) => event.date === today);
  const upcomingEvents = relevant.filter((event) => event.date > today);

  return {
    today: todayEvents.length ? { status: "populated", data: todayEvents } : { status: "empty" },
    upcoming: upcomingEvents.length ? { status: "populated", data: upcomingEvents } : { status: "empty" },
  };
}

export function formatScheduleDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function splitHouseholdSchedule(
  schedule: SectionState<ScheduleEvent[]>,
  today: string,
): {
  today: SectionState<ScheduleEvent[]>;
  upcoming: SectionState<ScheduleEvent[]>;
} {
  if (schedule.status !== "populated") {
    return { today: schedule, upcoming: schedule };
  }

  const through = new Date(`${today}T12:00:00Z`);
  through.setUTCDate(through.getUTCDate() + 5);
  const throughIso = through.toISOString().slice(0, 10);
  const ordered = [...schedule.data].sort((left, right) =>
    `${left.date}T${left.startTime ?? "00:00"}`.localeCompare(
      `${right.date}T${right.startTime ?? "00:00"}`,
    ),
  );
  const todayEvents = ordered.filter((event) => event.date === today);
  const upcomingEvents = ordered.filter((event) => event.date > today && event.date <= throughIso);

  return {
    today: todayEvents.length ? { status: "populated", data: todayEvents } : { status: "empty" },
    upcoming: upcomingEvents.length ? { status: "populated", data: upcomingEvents } : { status: "empty" },
  };
}
