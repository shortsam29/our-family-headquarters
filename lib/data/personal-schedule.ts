import type { ScheduleEvent } from "@/types/features";
import type { SectionState } from "@/types/today";

export function splitPersonalSchedule(
  schedule: SectionState<ScheduleEvent[]>,
  today: string,
): {
  today: SectionState<ScheduleEvent[]>;
  upcoming: SectionState<ScheduleEvent[]>;
} {
  if (schedule.status !== "populated") {
    return { today: schedule, upcoming: schedule };
  }

  const relevant = schedule.data
    .filter((event) => event.date >= today)
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
