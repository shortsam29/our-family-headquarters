"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { vaultCategories } from "@/lib/data/vault";

const allowedTypes = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
]);
const metadataSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(vaultCategories),
  visibility: z.enum(["household", "adults"]),
  expirationDate: z.iso.date().optional(),
  notes: z.string().trim().max(2000).optional(),
  documentId: z.uuid().optional(),
});

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "document";
}

export async function saveVaultDocument(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!["household_manager", "parent"].includes(context.role)) redirect("/documents?error=permission");
  const parsed = metadataSchema.safeParse({
    title: formData.get("title"), category: formData.get("category"),
    visibility: formData.get("visibility"), expirationDate: formData.get("expirationDate") || undefined,
    notes: formData.get("notes") || undefined, documentId: formData.get("documentId") || undefined,
  });
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File) || file.size === 0 || file.size > 20 * 1024 * 1024 || !allowedTypes.has(file.type)) {
    redirect("/documents?error=validation");
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/documents?error=service");
  const documentId = parsed.data.documentId ?? crypto.randomUUID();
  let previousPath: string | null = null;
  if (parsed.data.documentId) {
    const { data } = await supabase.from("vault_documents").select("storage_path").eq("id", documentId).eq("household_id", context.householdId).maybeSingle();
    if (!data) redirect("/documents?error=permission");
    previousPath = data.storage_path;
  }
  const storagePath = `${context.householdId}/${documentId}/${Date.now()}-${safeName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("family-vault").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) redirect("/documents?error=upload");
  const payload = {
    id: documentId, household_id: context.householdId, title: parsed.data.title,
    category: parsed.data.category, owner_member_id: context.familyMemberId,
    visibility: parsed.data.visibility, storage_path: storagePath,
    file_name: file.name, mime_type: file.type, file_size: file.size,
    expiration_date: parsed.data.expirationDate ?? null, notes: parsed.data.notes ?? null,
  };
  const { error: metadataError } = parsed.data.documentId
    ? await supabase.from("vault_documents").update(payload).eq("id", documentId).eq("household_id", context.householdId)
    : await supabase.from("vault_documents").insert(payload);
  if (metadataError) {
    await supabase.storage.from("family-vault").remove([storagePath]);
    redirect("/documents?error=save");
  }
  if (previousPath) await supabase.storage.from("family-vault").remove([previousPath]);
  revalidatePath("/documents");
  redirect(`/documents?status=${parsed.data.documentId ? "replaced" : "uploaded"}`);
}

export async function deleteVaultDocument(documentId: string) {
  const context = await requireCurrentHouseholdContext();
  if (!["household_manager", "parent"].includes(context.role) || !z.uuid().safeParse(documentId).success) redirect("/documents?error=permission");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/documents?error=service");
  const { data } = await supabase.from("vault_documents").select("storage_path").eq("id", documentId).eq("household_id", context.householdId).maybeSingle();
  if (!data) redirect("/documents?error=permission");
  if (data.storage_path) {
    const { error } = await supabase.storage.from("family-vault").remove([data.storage_path]);
    if (error) redirect("/documents?error=delete");
  }
  const { error } = await supabase.from("vault_documents").delete().eq("id", documentId).eq("household_id", context.householdId);
  if (error) redirect("/documents?error=delete");
  revalidatePath("/documents");
  redirect("/documents?status=deleted");
}
