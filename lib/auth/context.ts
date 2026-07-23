import { redirect } from "next/navigation";
import { isDevelopmentAuthBypassEnabled } from "@/lib/environment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentHouseholdContext = {
  userId: string;
  householdId: string;
  householdName: string;
  timeZone: string;
  familyMemberId: string;
  displayName: string;
  role: "household_manager" | "parent" | "child" | "caregiver" | "guest";
  source: "supabase" | "development-fixture";
};

const developmentContext: CurrentHouseholdContext = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  householdName: "Sample Family Home",
  timeZone: "America/New_York",
  familyMemberId: "member-current",
  displayName: "Family Member",
  role: "household_manager",
  source: "development-fixture",
};

export async function resolveCurrentHouseholdContext(): Promise<CurrentHouseholdContext | null> {
  if (isDevelopmentAuthBypassEnabled()) return developmentContext;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("household_memberships")
    .select("household_id, family_member_id, family_members!inner(display_name, role), households!inner(name,time_zone)")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const member = data.family_members as unknown as { display_name: string; role: CurrentHouseholdContext["role"] };
  const household = data.households as unknown as { name: string; time_zone: string };
  return {
    userId: authData.user.id,
    householdId: data.household_id,
    householdName: household.name,
    timeZone: household.time_zone,
    familyMemberId: data.family_member_id,
    displayName: member.display_name,
    role: member.role,
    source: "supabase",
  };
}

export async function requireCurrentHouseholdContext() {
  const context = await resolveCurrentHouseholdContext();
  if (!context) redirect("/sign-in");
  return context;
}
