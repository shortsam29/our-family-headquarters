"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  title: z.string().trim().min(1).max(160), date: z.iso.date(), allDay: z.boolean(),
  startTime: z.string().optional(), endTime: z.string().optional(), location: z.string().trim().max(240).optional(),
  category: z.enum(["household","family","school","work","appointment","celebration"]), notes: z.string().trim().max(2000).optional(),
  participantIds: z.array(z.uuid()).default([]), recurrence: z.enum(["","daily","weekly","monthly","yearly"]), reminderMinutes: z.union([z.literal(""),z.coerce.number().int().min(0).max(10080)]),
});

function offsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset", hour: "2-digit" }).formatToParts(date);
  const value = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const match = value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  return (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3]));
}

function localDateTimeToIso(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number); const [hour, minute] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000).toISOString();
}

function parse(formData: FormData) {
  const allDay = formData.get("allDay") === "on";
  return eventSchema.safeParse({
    title: formData.get("title"), date: formData.get("date"), allDay,
    startTime: allDay ? undefined : String(formData.get("startTime") ?? ""), endTime: allDay ? undefined : String(formData.get("endTime") ?? ""),
    location: String(formData.get("location") ?? ""), category: formData.get("category"), notes: String(formData.get("notes") ?? ""),
    participantIds: formData.getAll("participantIds"), recurrence: String(formData.get("recurrence") ?? ""), reminderMinutes: String(formData.get("reminderMinutes") ?? ""),
  });
}

export async function saveScheduleEvent(eventId: string | null, formData: FormData) {
  const returnTo = formData.get("returnTo") === "/" ? "/" : "/schedule";
  const context = await requireCurrentHouseholdContext();
  if (!["household_manager","parent"].includes(context.role)) redirect(`${returnTo}?error=permission`);
  const parsed = parse(formData); if (!parsed.success) redirect(`${returnTo}?error=event`);
  const supabase = await createSupabaseServerClient(); if (!supabase) redirect(`${returnTo}?error=service`);
  const value = parsed.data;
  if (!value.allDay && !value.startTime) redirect(`${returnTo}?error=time`);
  const startIso = value.allDay ? null : localDateTimeToIso(value.date, value.startTime!, context.timeZone);
  const endIso = value.allDay ? null : value.endTime && value.endTime > value.startTime! ? localDateTimeToIso(value.date, value.endTime, context.timeZone) : new Date(new Date(startIso!).getTime() + 60 * 60 * 1000).toISOString();
  const row = { household_id: context.householdId, created_by_member_id: context.familyMemberId, title: value.title,
    description: value.notes || null, category: value.category, location: value.location || null, is_all_day: value.allDay,
    all_day_date: value.allDay ? value.date : null, recurrence: value.recurrence || null, reminder_minutes: value.reminderMinutes === "" ? null : value.reminderMinutes, starts_at: startIso,
    ends_at: endIso, cancelled_at: null };
  const result = eventId
    ? await supabase.from("schedule_events").update(row).eq("id", eventId).eq("household_id", context.householdId).select("id").single()
    : await supabase.from("schedule_events").insert(row).select("id").single();
  if (result.error) redirect(`${returnTo}?error=save`);
  await supabase.from("event_participants").delete().eq("event_id", result.data.id);
  if (value.participantIds.length) await supabase.from("event_participants").insert(value.participantIds.map((family_member_id) => ({ event_id: result.data.id, family_member_id })));
  revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/my-day"); revalidatePath("/kenzie");
  redirect(`${returnTo}?status=event-saved`);
}

export async function deleteScheduleEvent(eventId: string) {
  const context = await requireCurrentHouseholdContext(); if (!["household_manager","parent"].includes(context.role)) return;
  const supabase = await createSupabaseServerClient(); if (!supabase) return;
  await supabase.from("schedule_events").delete().eq("id", eventId).eq("household_id", context.householdId);
  revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/my-day"); revalidatePath("/kenzie");
}
