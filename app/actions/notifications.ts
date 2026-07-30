"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { nextReminderDueAt } from "@/lib/kenzie/notifications/recurrence";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

function refresh() {
  revalidatePath("/notifications");
  revalidatePath("/my-headquarters");
  revalidatePath("/", "layout");
}

export async function markNotificationRead(formData: FormData) {
  const id = idSchema.safeParse(formData.get("notificationId"));
  if (!id.success) return;
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("internal_notifications").update({ read_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId);
  refresh();
}

export async function markAllNotificationsRead() {
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("internal_notifications").update({ read_at: new Date().toISOString() })
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .is("read_at", null);
  refresh();
}

export async function completeReminder(formData: FormData) {
  const id = idSchema.safeParse(formData.get("reminderId"));
  if (!id.success) return;
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { data: reminder } = await supabase.from("household_reminders")
    .select("due_at,time_zone,recurrence")
    .eq("id", id.data)
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .maybeSingle();
  if (!reminder) return;
  const nextDueAt = reminder.recurrence
    ? nextReminderDueAt(reminder.due_at, reminder.time_zone, reminder.recurrence)
    : null;
  await supabase.from("household_reminders").update(nextDueAt
    ? { due_at: nextDueAt, status: "pending" }
    : { status: "completed" })
    .eq("id", id.data)
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId);
  if (nextDueAt) {
    refresh();
    return;
  }
  await supabase.from("internal_notifications").update({ read_at: new Date().toISOString() })
    .eq("source_reminder_id", id.data)
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId);
  refresh();
}
