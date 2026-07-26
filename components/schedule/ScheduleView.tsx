"use client";

import { useMemo, useState } from "react";
import { deleteScheduleEvent, saveScheduleEvent } from "@/app/actions/schedule";
import type { ManagedFamilyMember } from "@/lib/data/core";
import type { ScheduleEvent, ScheduleView as ViewName } from "@/types/features";
import styles from "./ScheduleView.module.css";

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const addDays = (value: string, amount: number) => { const d=new Date(`${value}T12:00:00`); d.setDate(d.getDate()+amount); return iso(d); };
const startOfWeek = (value: string) => { const d=new Date(`${value}T12:00:00`); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return iso(d); };
const monthCells = (value: string) => { const d=new Date(`${value}T12:00:00`); const first=iso(new Date(d.getFullYear(),d.getMonth(),1)); const start=startOfWeek(first); return Array.from({length:42},(_,i)=>addDays(start,i)); };
const label = (value:string, options:Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined,options).format(new Date(`${value}T12:00:00`));

function EventCard({ event, members, canManage }: { event: ScheduleEvent; members: ManagedFamilyMember[]; canManage: boolean }) {
  return <article className={styles.event} data-category={event.category}>
    <div><h3>{event.title}</h3><p><time dateTime={event.date}>{event.allDay ? "All day" : `${event.startTime ?? ""}${event.endTime ? `–${event.endTime}` : ""}`}</time>{event.location ? ` · ${event.location}` : ""}</p></div>
    {event.description ? <p>{event.description}</p> : null}
    {canManage ? <details><summary>Edit event</summary><EventForm event={event} members={members} /><form action={deleteScheduleEvent.bind(null,event.id)}><button className={styles.danger}>Delete event</button></form></details> : null}
  </article>;
}
function EventForm({ event, members, selectedDate }: { event?:ScheduleEvent; members:ManagedFamilyMember[]; selectedDate?:string }) {
  return <form action={saveScheduleEvent.bind(null,event?.id ?? null)} className={styles.form}>
    <label>Title<input name="title" defaultValue={event?.title} required maxLength={160}/></label>
    <label>Date<input name="date" type="date" defaultValue={event?.date ?? selectedDate} required/></label>
    <label className={styles.check}><input name="allDay" type="checkbox" defaultChecked={event?.allDay}/> All day</label>
    <label>Start time<input name="startTime" type="time" defaultValue={event?.startTime}/></label><label>End time<input name="endTime" type="time" defaultValue={event?.endTime}/></label>
    <label>Category<select name="category" defaultValue={event?.category ?? "family"}><option value="household">Household</option><option value="family">Family</option><option value="school">School</option><option value="work">Work</option><option value="appointment">Appointment</option><option value="celebration">Celebration</option></select></label>
    <label>Location<input name="location" defaultValue={event?.location} maxLength={240}/></label><label>Repeat<select name="recurrence" defaultValue=""><option value="">Does not repeat</option><option>daily</option><option>weekly</option><option>monthly</option></select></label><label>Reminder<select name="reminderMinutes" defaultValue=""><option value="">No reminder</option><option value="15">15 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></label>
    <fieldset><legend>Participants</legend>{members.filter(m=>m.status==="active").map(m=><label className={styles.check} key={m.id}><input type="checkbox" name="participantIds" value={m.id} defaultChecked={event?.participantIds.includes(m.id)}/>{m.displayName}</label>)}</fieldset>
    <label className={styles.wide}>Notes<textarea name="notes" defaultValue={event?.description} maxLength={2000}/></label><button type="submit">{event ? "Save event" : "Add event"}</button>
  </form>;
}
export default function ScheduleView({ events, members, canManage, today }: { events:ScheduleEvent[]; members:ManagedFamilyMember[]; canManage:boolean; today:string }) {
  const [view,setView]=useState<ViewName>("week"); const [selected,setSelected]=useState(today);
  const dates=useMemo(()=>view==="month"?monthCells(selected):view==="week"?Array.from({length:7},(_,i)=>addDays(startOfWeek(selected),i)):[selected],[view,selected]);
  const visible=view==="agenda"?events.filter(e=>e.date>=selected).slice(0,30):events.filter(e=>dates.includes(e.date));
  const move=(n:number)=>setSelected(addDays(selected,n*(view==="day"?1:view==="week"?7:30)));
  return <div className={styles.calendar}>
    <div className={styles.toolbar}><div className={styles.views}>{(["day","week","month","agenda"] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div><div className={styles.navigation}><button onClick={()=>move(-1)} aria-label="Previous period">‹</button><button onClick={()=>setSelected(today)}>Today</button><input aria-label="Choose date" type="date" value={selected} onChange={e=>setSelected(e.target.value)}/><button onClick={()=>move(1)} aria-label="Next period">›</button></div></div>
    <div className={styles.periodHeading}><h2>{view==="month"?label(selected,{month:"long",year:"numeric"}):label(selected,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h2>{canManage?<details className={styles.add}><summary>+ Add Event</summary><EventForm members={members} selectedDate={selected}/></details>:null}</div>
    {view==="agenda" ? <div className={styles.agenda}>{visible.length?visible.map(e=><div key={e.id} className={styles.agendaRow}><time>{label(e.date,{weekday:"short",month:"short",day:"numeric"})}</time><EventCard event={e} members={members} canManage={canManage}/></div>):<p>No upcoming events. {canManage?"Add an event whenever the family is ready.":"The household calendar is clear."}</p>}</div> :
    <div className={view==="month"?styles.monthGrid:styles.dayGrid}>{dates.map(date=><section key={date} className={`${styles.day} ${date===today?styles.currentDay:""}`}><h3><time dateTime={date}>{label(date,{weekday:"short",month:"short",day:"numeric"})}</time></h3>{events.filter(e=>e.date===date).map(e=><EventCard key={e.id} event={e} members={members} canManage={canManage}/>)}</section>)}</div>}
  </div>;
}
