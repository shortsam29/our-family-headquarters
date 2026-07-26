"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const roleSchema = z.enum(["household_manager", "parent", "child", "caregiver", "guest"]);
const statusSchema = z.enum(["active", "inactive", "archived"]);
const memberIdSchema = z.uuid();
function canManage(role: string) { return role === "household_manager" || role === "parent"; }

export type InvitationActionState = { code?: string; memberId?: string; error?: string };
export async function generateJoinCode(_: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const memberId = memberIdSchema.safeParse(formData.get("memberId"));
  if (!memberId.success) return { error: "Choose a valid family member." };
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) return { error: "Only a household manager or parent can create a join code." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "The secure household service is unavailable." };
  const { data: member } = await supabase.from("family_members").select("id,linked_user_id,role,status").eq("id", memberId.data).eq("household_id", context.householdId).maybeSingle();
  if (!member || member.linked_user_id || member.status !== "active" || member.role === "household_manager") return { error: "This family member cannot receive a join code." };
  await supabase.from("household_invitations").update({ status: "disabled" }).eq("family_member_id", member.id).eq("status", "active");
  const code = randomBytes(8).toString("hex").toUpperCase();
  const codeHash = `\\x${createHash("sha256").update(code).digest("hex")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("household_invitations").insert({ household_id: context.householdId, family_member_id: member.id, code_hash: codeHash, expires_at: expiresAt, created_by_member_id: context.familyMemberId });
  if (error) return { error: "We couldn’t create the join code. Please try again." };
  revalidatePath("/family-hub");
  return { code: `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12)}`, memberId: member.id };
}

export async function disableJoinCode(formData: FormData) {
  const memberId = memberIdSchema.safeParse(formData.get("memberId"));
  if (!memberId.success) redirect("/family-hub?error=validation");
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/family-hub?error=permission");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/family-hub?error=service");
  const { error } = await supabase.from("household_invitations").update({ status: "disabled" }).eq("household_id", context.householdId).eq("family_member_id", memberId.data).eq("status", "active");
  if (error) redirect("/family-hub?error=save");
  revalidatePath("/family-hub");
  redirect("/family-hub?status=invitation-disabled");
}

export async function removeFamilyMember(formData: FormData) {
  const memberId = memberIdSchema.safeParse(formData.get("memberId"));
  if (!memberId.success) redirect("/family-hub?error=validation");
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/family-hub?error=permission");
  if (memberId.data === context.familyMemberId) redirect("/family-hub?error=current-member");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/family-hub?error=service");
  const { error } = await supabase.rpc("archive_household_member", { target_member_id: memberId.data });
  if (error) redirect("/family-hub?error=save");
  revalidatePath("/family-hub");
  revalidatePath("/household");
  redirect("/family-hub?status=member-removed");
}

export async function addFamilyMember(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/family-hub?error=permission");
  const values = z.object({ displayName: z.string().trim().min(1).max(100), role: roleSchema.exclude(["household_manager"]) }).safeParse({ displayName: formData.get("displayName"), role: formData.get("role") });
  if (!values.success) redirect("/family-hub?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/family-hub?error=service");
  const { error } = await supabase.from("family_members").insert({ household_id: context.householdId, display_name: values.data.displayName, role: values.data.role, status: "active" });
  if (error) redirect("/family-hub?error=save");
  revalidatePath("/family-hub");
  revalidatePath("/household");
  redirect("/family-hub?status=member-added");
}

export async function updateFamilyMember(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) redirect("/family-hub?error=permission");
  const values = z.object({ memberId: z.uuid(), displayName: z.string().trim().min(1).max(100), role: roleSchema, status: statusSchema }).safeParse({ memberId: formData.get("memberId"), displayName: formData.get("displayName"), role: formData.get("role"), status: formData.get("status") });
  if (!values.success) redirect("/family-hub?error=validation");
  if (values.data.memberId === context.familyMemberId && values.data.status !== "active") redirect("/family-hub?error=current-member");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/family-hub?error=service");
  const { error } = await supabase.from("family_members").update({ display_name: values.data.displayName, role: values.data.memberId === context.familyMemberId ? context.role : values.data.role, status: values.data.status }).eq("id", values.data.memberId).eq("household_id", context.householdId);
  if (error) redirect("/family-hub?error=save");
  revalidatePath("/family-hub");
  revalidatePath("/household");
  redirect("/family-hub?status=member-saved");
}