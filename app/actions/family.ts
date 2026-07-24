"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const roleSchema = z.enum(["household_manager", "parent", "child", "caregiver", "guest"]);
const statusSchema = z.enum(["active", "inactive", "archived"]);

function canManage(role: string) {
  return role === "household_manager" || role === "parent";
}

export async function addFamilyMember(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/family-hub?error=permission");
  const values = z.object({
    displayName: z.string().trim().min(1).max(100),
    role: roleSchema.exclude(["household_manager"]),
  }).safeParse({
    displayName: formData.get("displayName"),
    role: formData.get("role"),
  });
  if (!values.success) redirect("/family-hub?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/family-hub?error=service");
  const { error } = await supabase.from("family_members").insert({
    household_id: context.householdId,
    display_name: values.data.displayName,
    role: values.data.role,
    status: "active",
  });
  if (error) redirect("/family-hub?error=save");
  revalidatePath("/family-hub");
  revalidatePath("/household");
  redirect("/family-hub?status=member-added");
}

export async function updateFamilyMember(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/family-hub?error=permission");
  const values = z.object({
    memberId: z.uuid(),
    displayName: z.string().trim().min(1).max(100),
    role: roleSchema,
    status: statusSchema,
  }).safeParse({
    memberId: formData.get("memberId"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    status: formData.get("status"),
  });
  if (!values.success) redirect("/family-hub?error=validation");
  if (values.data.memberId === context.familyMemberId && values.data.status !== "active") redirect("/family-hub?error=current-member");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/family-hub?error=service");
  const { error } = await supabase
    .from("family_members")
    .update({
      display_name: values.data.displayName,
      role: values.data.memberId === context.familyMemberId ? context.role : values.data.role,
      status: values.data.status,
    })
    .eq("id", values.data.memberId)
    .eq("household_id", context.householdId);
  if (error) redirect("/family-hub?error=save");
  revalidatePath("/family-hub");
  revalidatePath("/household");
  redirect("/family-hub?status=member-saved");
}
