"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { buildScheduleEventRow, parseScheduleEventForm } from "@/lib/schedule/event-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ScheduleActionState = { status: "idle" | "success" | "error"; message?: string; eventId?: string };
function refreshSchedule() {
  for (const path of ["/", "/schedule", "/my-headquarters", "/kenzie"]) revalidatePath(path);
}

async function persistScheduleEvent(eventId: string | null, formData: FormData): Promise<ScheduleActionState> {
  const context = await requireCurrentHouseholdContext();
  if (!["household_manager", "parent"].includes(context.role)) return { status: "error", message: "A parent or household manager can save family events." };
  const parsed = parseScheduleEventForm(formData);
  if (!parsed.success) {
    console.error("Schedule event validation failed", parsed.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })));
    return { status: "error", message: "Please check the title, date, and time, then try again." };
  }
  const row = buildScheduleEventRow(parsed.data, context);
  if (!row) return { status: "error", message: "Choose a start time, or mark the event as all day." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "The calendar service is temporarily unavailable." };

  const uniqueParticipants = [...new Set(parsed.data.participantIds)];
  if (uniqueParticipants.length) {
    const members = await supabase.from("family_members").select("id").eq("household_id", context.householdId).in("id", uniqueParticipants);
    if (members.error || (members.data?.length ?? 0) !== uniqueParticipants.length) {
      console.error("Schedule participant validation failed", members.error?.code);
      return { status: "error", message: "One of the selected family members is unavailable. Please review participants and try again." };
    }
  }

  const previous = eventId
    ? await supabase.from("event_participants").select("family_member_id").eq("event_id", eventId)
    : { data: [] as { family_member_id: string }[], error: null };
  const result = eventId
    ? await supabase.from("schedule_events").update(row).eq("id", eventId).eq("household_id", context.householdId).select("id").single()
    : await supabase.from("schedule_events").insert(row).select("id").single();
  if (result.error || !result.data) {
    console.error("Schedule event persistence failed", { code: result.error?.code, details: result.error?.details, hint: result.error?.hint });
    return { status: "error", message: "The event could not be saved. Your information is still here; please try again." };
  }

  const savedId = result.data.id;
  const removed = await supabase.from("event_participants").delete().eq("event_id", savedId);
  const added = uniqueParticipants.length
    ? await supabase.from("event_participants").insert(uniqueParticipants.map((family_member_id) => ({ event_id: savedId, family_member_id })))
    : { error: null };
  if (removed.error || added.error) {
    console.error("Schedule participant persistence failed", { deleteCode: removed.error?.code, insertCode: added.error?.code });
    if (eventId) {
      await supabase.from("event_participants").delete().eq("event_id", savedId);
      const old = previous.data ?? [];
      if (old.length) await supabase.from("event_participants").insert(old.map((item) => ({ event_id: savedId, family_member_id: item.family_member_id })));
    } else {
      await supabase.from("schedule_events").delete().eq("id", savedId).eq("household_id", context.householdId);
    }
    return { status: "error", message: "The event was not saved because its family members could not be attached. Please try again." };
  }
  refreshSchedule();
  return { status: "success", message: "Event saved. It is now on the household calendar.", eventId: savedId };
}

export async function saveScheduleEventState(eventId: string | null, _previous: ScheduleActionState, formData: FormData) {
  return persistScheduleEvent(eventId, formData);
}

export async function saveScheduleEvent(eventId: string | null, formData: FormData) {
  const returnTo = formData.get("returnTo") === "/" ? "/" : "/schedule";
  const result = await persistScheduleEvent(eventId, formData);
  redirect(`${returnTo}?${result.status === "success" ? "status=event-saved" : `error=${encodeURIComponent(result.message ?? "save")}`}`);
}

export async function deleteScheduleEvent(eventId: string) {
  const context = await requireCurrentHouseholdContext();
  if (!["household_manager", "parent"].includes(context.role)) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const result = await supabase.from("schedule_events").delete().eq("id", eventId).eq("household_id", context.householdId);
  if (result.error) console.error("Schedule event deletion failed", result.error.code);
  else refreshSchedule();
}