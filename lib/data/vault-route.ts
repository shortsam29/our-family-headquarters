import { redirect } from "next/navigation";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getVaultFileRedirect(documentId: string, download: boolean) {
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/documents?error=service");
  const { data } = await supabase.from("vault_documents").select("storage_path,title").eq("id", documentId).eq("household_id", context.householdId).maybeSingle();
  if (!data?.storage_path) redirect("/documents?error=missing");
  const { data: signed, error } = await supabase.storage.from("family-vault").createSignedUrl(data.storage_path, 60, download ? { download: data.title } : undefined);
  if (error || !signed) redirect("/documents?error=access");
  redirect(signed.signedUrl);
}
