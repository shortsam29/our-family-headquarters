"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const noteIdSchema = z.uuid();
const createSchema = z.object({
  recipientMemberId: z.uuid(),
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(4000),
  destination: z.string().trim().regex(/^\/[A-Za-z0-9/_-]*$/).max(300).optional(),
});

export async function markKenzieNoteRead(formData: FormData) {
  const noteId = noteIdSchema.safeParse(formData.get("noteId"));
  if (!noteId.success) return;
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase
    .from("kenzie_notes")
    .update({ read_at: new Date().toISOString() })
    .eq("id", noteId.data)
    .eq("household_id", context.householdId)
    .eq("recipient_member_id", context.familyMemberId);
  revalidatePath("/my-headquarters");
  revalidatePath("/", "layout");
}

export async function createKenzieNoteForMember(input: unknown) {
  const values = createSchema.safeParse(input);
  if (!values.success) return { ok: false as const, reason: "invalid_input" as const };
  const context = await requireCurrentHouseholdContext();
  if (!["household_manager", "parent"].includes(context.role)) return { ok: false as const, reason: "forbidden" as const };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, reason: "unavailable" as const };
  const { data: recipient } = await supabase
    .from("household_memberships")
    .select("family_member_id")
    .eq("household_id", context.householdId)
    .eq("family_member_id", values.data.recipientMemberId)
    .eq("status", "active")
    .maybeSingle();
  if (!recipient) return { ok: false as const, reason: "forbidden" as const };
  const { error } = await supabase.from("kenzie_notes").insert({
    household_id: context.householdId,
    recipient_member_id: recipient.family_member_id,
    title: values.data.title,
    message: values.data.message,
    related_destination: values.data.destination ?? null,
    created_by_kind: "household_member",
    created_by_member_id: context.familyMemberId,
  });
  if (error) return { ok: false as const, reason: "failed" as const };
  revalidatePath("/my-headquarters");
  revalidatePath("/", "layout");
  return { ok: true as const };
}
