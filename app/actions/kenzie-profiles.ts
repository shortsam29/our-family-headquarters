"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { kenzieProfileKeySchema } from "@/lib/kenzie/profiles/registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const assignmentSchema = z.object({
  memberId: z.uuid(),
  profileKey: z.union([kenzieProfileKeySchema, z.literal("")]),
});

export type KenzieProfileAssignmentState = {
  memberId?: string;
  saved?: boolean;
  error?: string;
};

export async function saveKenzieProfileAssociation(
  _: KenzieProfileAssignmentState,
  formData: FormData,
): Promise<KenzieProfileAssignmentState> {
  const values = assignmentSchema.safeParse({
    memberId: formData.get("memberId"),
    profileKey: formData.get("profileKey"),
  });
  if (!values.success) return { error: "Choose a valid Kenzie profile." };

  const context = await requireCurrentHouseholdContext();
  if (!["household_manager", "parent"].includes(context.role)) {
    return { memberId: values.data.memberId, error: "Only a household manager or parent can change Kenzie personalization." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { memberId: values.data.memberId, error: "Kenzie personalization is unavailable." };

  const { data: membership } = await supabase
    .from("household_memberships")
    .select("family_member_id")
    .eq("household_id", context.householdId)
    .eq("family_member_id", values.data.memberId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return { memberId: values.data.memberId, error: "That member does not have active household access." };

  const result = await supabase.from("kenzie_profile_associations").upsert({
    household_id: context.householdId,
    family_member_id: membership.family_member_id,
    profile_key: values.data.profileKey || null,
    assigned_by_member_id: context.familyMemberId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "family_member_id" });

  if (result.error) return { memberId: values.data.memberId, error: "Kenzie personalization could not be saved." };
  revalidatePath("/settings");
  return { memberId: values.data.memberId, saved: true };
}
