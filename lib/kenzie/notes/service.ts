import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type KenzieNoteSummary = {
  id: string;
  title: string;
  message: string;
  destination?: string;
  createdAt: string;
  read: boolean;
};

export async function getMyKenzieNotes(context: CurrentHouseholdContext): Promise<KenzieNoteSummary[]> {
  if (context.source !== "supabase") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("kenzie_notes")
    .select("id,title,message,related_destination,created_at,read_at")
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return (data ?? []).map((note) => ({
    id: note.id,
    title: note.title,
    message: note.message,
    destination: note.related_destination ?? undefined,
    createdAt: note.created_at,
    read: Boolean(note.read_at),
  }));
}

export async function getMyUnreadNotificationCount(context: CurrentHouseholdContext): Promise<number> {
  if (context.source !== "supabase") return 0;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;
  const result = await supabase
    .from("internal_notifications")
    .select("id", { count: "exact", head: true })
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId)
    .is("read_at", null);
  return result.error ? 0 : result.count ?? 0;
}
