import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MemberAccountEmail = { memberId: string; email: string };

export async function getHouseholdMemberAccountEmails(context: CurrentHouseholdContext): Promise<MemberAccountEmail[]> {
  if (context.source !== "supabase" || !["household_manager", "parent"].includes(context.role)) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("household_member_account_emails");
  if (error) return [];
  return (data ?? []).map((row: { member_id: string; email: string }) => ({ memberId: row.member_id, email: row.email }));
}
