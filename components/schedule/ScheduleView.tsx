"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteScheduleEvent, saveScheduleEventState } from "@/app/actions/schedule";
import type { ManagedFamilyMember } from "@/lib/data/core";
import type { ScheduleActionState } from "@/app/actions/schedule";
import type { ScheduleEvent, ScheduleView as ViewName } from "@/types/features";
import styles from "./ScheduleView.module.css";

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (value: string, count: number) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + count); return iso(date); };
const startOfWeek = (value: string) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return iso(date); };
const monthCells = (value: string) => { const date = new Date(`${value}T12:00:00`); const first = iso(new Date(date.getFullYear(), date.getMonth(), 1)); const start = startOfWeek(first); return Array.from({ length: 42 }, (_, index) => addDays(start, index)); };
const label = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, options).format(new Date(`${value}T12:00:00`));
const displayTime = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${value}:00`)) : "";

function EventForm({ event, members, selectedDate, onSaved, onCancel }: { event?: ScheduleEvent; members: ManagedFamilyMember[]; selectedDate?: string; onSaved?: () => void; onCancel?: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(saveScheduleEventState.bind(null, event?.id ?? null), { status: "idle" } as ScheduleActionState);
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
      onSaved?.();
    }
  }, [state, router, onSaved]);
  return <form ref={formRef} action={action} className={styles.form}>
    <input type="hidden" name="category" value="household" />
    <label>Title<input name="title" defaultValue={event?.title} required maxLength={160} /></label>
    <label>Date<input name="date" type="date" defaultValue={event?.date ?? selectedDate} required /></label>
    <label className={styles.check}><input name="allDay" type="checkbox" defaultChecked={event?.allDay} />All day</label>
    <div className={styles.timeGroup}><label>Start<input name="startTime" type="time" defaultValue={event?.startTime} /></label><label>End<input name="endTime" type="time" defaultValue={event?.endTime} /></label></div>
    <label>Location<input name="location" defaultValue={event?.location} maxLength={240} /></label>
    <div className={styles.timeGroup}><label>Repeat<select name="recurrence" defaultValue=""><option value="">Does not repeat</option><option>daily</option><option>weekly</option><option>monthly</option><option>yearly</option></select></label><label>Reminder<select name="reminderMinutes" defaultValue=""><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></label></div>
    <fieldset><legend>Participants</legend><div className={styles.participants}>{members.filter((member) => member.status === "active").map((member) => <label className={styles.check} key={member.id}><input type="checkbox" name="participantIds" value={member.id} defaultChecked={event?.participantIds.includes(member.id)} />{member.displayName}</label>)}</div></fieldset>
    <label>Notes<textarea name="notes" defaultValue={event?.description} maxLength={2000} /></label>
    {state.status === "error" ? <p className={styles.error} role="alert">{state.message}</p> : null}
    {state.status === "success" ? <p className={styles.success} role="status">{state.message}</p> : null}
    <div className={styles.formActions}><button type="submit" disabled={pending}>{pending ? "Saving..." : event ? "Save event" : "Add event"}</button>{onCancel ? <button type="button" className={styles.secondary} onClick={onCancel}>Cancel</button> : null}</div>
  </form>;
}

function EventCard({ event, members, canManage, onSaved }: { event: ScheduleEvent; members: ManagedFamilyMember[]; canManage: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  return <article className={styles.event}><div><h3>{event.title}</h3><p><time dateTime={event.date}>{event.allDay ? "All day" : `${displayTime(event.startTime)}${event.endTime ? ` - ${displayTime(event.endTime)}` : ""}`}</time>{event.location ? ` - ${event.location}` : ""}</p></div>{event.description ? <p>{event.description}</p> : null}{canManage ? <div><button type="button" className={styles.editButton} onClick={() => setEditing((value) => !value)}>{editing ? "Close editor" : "Edit event"}</button>{editing ? <><EventForm event={event} members={members} onSaved={() => { setEditing(false); onSaved(); }} onCancel={() => setEditing(false)} /><form action={deleteScheduleEvent.bind(null, event.id)}><button className={styles.danger}>Delete event</button></form></> : null}</div> : null}</article>;
}

const daypart = (event: ScheduleEvent) => { if (event.allDay) return "All day"; const hour = Number(event.startTime?.slice(0, 2) ?? "12"); return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"; };

export default function ScheduleView({ events, members, canManage, today }: { events: ScheduleEvent[]; members: ManagedFamilyMember[]; canManage: boolean; today: string }) {
  const [view, setView] = useState<ViewName>("month");
  const [selected, setSelected] = useState(today);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const dates = useMemo(() => view === "month" ? monthCells(selected) : view === "week" ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(selected), index)) : [selected], [view, selected]);
  const move = (count: number) => { if (view === "month") { const date = new Date(`${selected}T12:00:00`); date.setMonth(date.getMonth() + count); setSelected(iso(date)); } else setSelected(addDays(selected, count * (view === "week" ? 7 : 1))); };
  const selectedMonth = new Date(`${selected}T12:00:00`).getMonth();
  const selectedEvents = events.filter((event) => event.date === selected);
  return <div className={styles.calendar}>
    <div className={styles.toolbar}><div className={styles.views}>{(["day", "week", "month"] as const).map((name) => <button key={name} aria-pressed={view === name} onClick={() => setView(name)}>{name[0].toUpperCase() + name.slice(1)}</button>)}</div><div className={styles.navigation}><button onClick={() => move(-1)} aria-label="Previous period">&larr;</button><button onClick={() => setSelected(today)}>Today</button><input aria-label="Choose date" type="date" value={selected} onChange={(event) => setSelected(event.target.value)} /><button onClick={() => move(1)} aria-label="Next period">&rarr;</button></div></div>
    <div className={styles.periodHeading}><div><p>{view === "month" ? "Household month" : view === "week" ? "Household week" : "Household day"}</p><h2>{view === "month" ? label(selected, { month: "long", year: "numeric" }) : label(selected, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h2></div>{canManage ? <button type="button" className={styles.addButton} onClick={() => setAdding((value) => !value)}>{adding ? "Close form" : "+ Add Event"}</button> : null}</div>
    {notice ? <p className={styles.success} role="status">{notice}</p> : null}
    {adding ? <EventForm members={members} selectedDate={selected} onSaved={() => { setAdding(false); setNotice("Event saved. It is now on the household calendar."); }} onCancel={() => setAdding(false)} /> : null}
    {view === "month" ? <><div className={styles.weekdays} aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className={styles.monthGrid}>{dates.map((date) => { const dayEvents = events.filter((event) => event.date === date); const outside = new Date(`${date}T12:00:00`).getMonth() !== selectedMonth; return <button type="button" key={date} className={`${styles.monthDay} ${date === today ? styles.currentDay : ""} ${date === selected ? styles.selectedDay : ""} ${outside ? styles.outsideMonth : ""}`} onClick={() => setSelected(date)} aria-label={`${label(date, { month: "long", day: "numeric" })}, ${dayEvents.length} events`}><time dateTime={date}>{Number(date.slice(-2))}</time>{dayEvents.slice(0, 3).map((event) => <span key={event.id}>{event.title}</span>)}{dayEvents.length > 3 ? <small>+{dayEvents.length - 3} more</small> : null}</button>; })}</div><section className={styles.selectedEvents}><h3>Events for {label(selected, { weekday: "long", month: "long", day: "numeric" })}</h3>{selectedEvents.length ? selectedEvents.map((event) => <EventCard key={event.id} event={event} members={members} canManage={canManage} onSaved={() => setNotice("Event saved. It is now on the household calendar.")} />) : <p>No events scheduled for this day.</p>}</section></> : view === "week" ? <div className={styles.weekGrid}>{dates.map((date) => <section key={date} className={`${styles.day} ${date === today ? styles.currentDay : ""}`}><button className={styles.dayHeading} onClick={() => { setSelected(date); setView("day"); }}><time dateTime={date}>{label(date, { weekday: "short", month: "short", day: "numeric" })}</time></button>{events.filter((event) => event.date === date).map((event) => <EventCard key={event.id} event={event} members={members} canManage={canManage} onSaved={() => setNotice("Event saved. It is now on the household calendar.")} />)}</section>)}</div> : <div className={styles.timeline}>{["All day", "Morning", "Afternoon", "Evening"].map((part) => <section key={part}><h3>{part}</h3><div>{selectedEvents.filter((event) => daypart(event) === part).map((event) => <EventCard key={event.id} event={event} members={members} canManage={canManage} onSaved={() => setNotice("Event saved. It is now on the household calendar.")} />)}{!selectedEvents.some((event) => daypart(event) === part) ? <p>No events</p> : null}</div></section>)}</div>}
  </div>;
}