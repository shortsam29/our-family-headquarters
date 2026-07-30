import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMemberProfileFromSources } from "@/lib/kenzie/profiles/registry";
import { kenzieProfileKeySchema, type KenzieProfileKey } from "@/lib/kenzie/profiles/registry";

export type KenzieAssociationResult =
  | { status: "found"; profileKey: unknown }
  | { status: "missing" | "unavailable" };

export async function loadKenzieAssociation(
  context: CurrentHouseholdContext,
): Promise<KenzieAssociationResult> {
  if (context.source !== "supabase") return { status: "missing" };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "unavailable" };
  const { data, error } = await supabase
    .from("kenzie_profile_associations")
    .select("profile_key")
    .eq("household_id", context.householdId)
    .eq("family_member_id", context.familyMemberId)
    .maybeSingle();
  if (error) return { status: "unavailable" };
  return data ? { status: "found", profileKey: data.profile_key } : { status: "missing" };
}

export async function resolveAuthenticatedMemberProfile(
  context: CurrentHouseholdContext,
  loadAssociation: (context: CurrentHouseholdContext) => Promise<KenzieAssociationResult> = loadKenzieAssociation,
) {
  let result: KenzieAssociationResult;
  try {
    result = await loadAssociation(context);
  } catch {
    result = { status: "unavailable" };
  }
  return resolveMemberProfileFromSources(context.familyMemberId, context.displayName, result);
}

export async function getManagedKenzieAssociations(
  context: CurrentHouseholdContext,
): Promise<Record<string, KenzieProfileKey>> {
  if (context.source !== "supabase" || !["household_manager", "parent"].includes(context.role)) return {};
  const supabase = await createSupabaseServerClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("kenzie_profile_associations")
    .select("family_member_id,profile_key")
    .eq("household_id", context.householdId);
  if (error) return {};
  return Object.fromEntries(
    (data ?? []).flatMap((row) => {
      const key = kenzieProfileKeySchema.safeParse(row.profile_key);
      return key.success ? [[row.family_member_id, key.data]] : [];
    }),
  );
}
