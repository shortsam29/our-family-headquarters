import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InternalNotification = {
  id: string;
  kind: "kenzie_note" | "reminder" | "chore" | "shopping" | "meal" | "calendar";
  title: string;
  body?: string;
  destination?: string;
  createdAt: string;
  read: boolean;
  reminderDueAt?: string;
};

export async function getMyNotifications(context: CurrentHouseholdContext): Promise<InternalNotification[]> {
  if (context.source !== "supabase") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("internal_notifications")
    .select("id,kind,title,body,related_destination,created_at,read_at,household_reminders(due_at)")
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return (data ?? []).map((item) => {
    const reminder = item.household_reminders as unknown as { due_at: string } | null;
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      body: item.body ?? undefined,
      destination: item.related_destination ?? undefined,
      createdAt: item.created_at,
      read: Boolean(item.read_at),
      reminderDueAt: reminder?.due_at,
    };
  });
}

export async function getMyUnreadNotificationCount(context: CurrentHouseholdContext): Promise<number> {
  if (context.source !== "supabase") return 0;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;
  const result = await supabase.from("internal_notifications")
    .select("id", { count: "exact", head: true })
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .is("read_at", null);
  return result.error ? 0 : result.count ?? 0;
}

export type ReminderSummary = {
  id: string;
  message: string;
  dueAt: string;
  status: "pending" | "completed" | "cancelled";
  destination?: string;
};

export async function getMyReminders(context: CurrentHouseholdContext): Promise<ReminderSummary[]> {
  if (context.source !== "supabase") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("household_reminders")
    .select("id,message,due_at,status,related_destination")
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .eq("status", "pending")
    .order("due_at")
    .limit(20);
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    message: item.message,
    dueAt: item.due_at,
    status: item.status,
    destination: item.related_destination ?? undefined,
  }));
}
