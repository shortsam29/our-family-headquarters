"use client";

import { useState } from "react";
import type { ScheduleEvent, ScheduleView as ScheduleViewName } from "@/types/features";
import styles from "./ScheduleView.module.css";

const weekDays = ["Today", "Tomorrow", "Friday", "Saturday", "Sunday", "Monday", "Tuesday"];

function EventItem({ event }: { event: ScheduleEvent }) {
  const timeLabel = event.allDay ? "All day" : `${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`;
  return (
    <li className={styles.event} data-category={event.category}>
      <h3 className="type-card-heading">{event.title}</h3>
      <p><time>{timeLabel}</time>{event.location ? ` · ${event.location}` : ""}</p>
      <div className={styles.eventMeta}>
        <span>{event.category}</span>
        <span>{event.scope === "household" ? "Household event" : "Relevant to you"}</span>
        <span>{event.participantIds.length} participant{event.participantIds.length === 1 ? "" : "s"}</span>
      </div>
    </li>
  );
}

export default function ScheduleView({ events }: { events: ScheduleEvent[] }) {
  const [view, setView] = useState<ScheduleViewName>("today");
  const visibleToday = events.filter((event) => event.date === "today");

  return (
    <>
      <div className={styles.toolbar} aria-label="Schedule view">
        {(["today", "week"] as const).map((option) => (
          <button key={option} type="button" className={styles.viewButton} aria-pressed={view === option} onClick={() => setView(option)}>
            {option === "today" ? "Today view" : "Week view"}
          </button>
        ))}
      </div>

      {view === "today" ? (
        <ul className={styles.eventList}>
          {visibleToday.map((event) => <EventItem key={event.id} event={event} />)}
        </ul>
      ) : (
        <div className={styles.days}>
          {weekDays.map((day, index) => (
            <section key={day} className={`${styles.day} ${index === 0 ? styles.currentDay : ""}`} aria-label={day}>
              <h3>{day}</h3>
              <ul className={styles.eventList}>
                {events
                  .filter((event) => event.date.toLowerCase() === day.toLowerCase() || (index === 0 && event.date === "today"))
                  .map((event) => <EventItem key={event.id} event={event} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
