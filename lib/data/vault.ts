import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const vaultCategories = [
  "Home", "Vehicles", "Insurance", "Medical", "School", "Finance", "Pets",
  "Appliances", "Warranties", "Receipts", "Taxes", "Personal", "Other",
] as const;

export type VaultDocument = {
  id: string;
  title: string;
  category: string;
  ownerMemberId?: string;
  visibility: "household" | "adults";
  storagePath?: string;
  expirationDate?: string;
  notes?: string;
};

export async function getVaultDocuments(context: CurrentHouseholdContext, search = "") {
  if (context.source !== "supabase") return { documents: [] as VaultDocument[] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { documents: [] as VaultDocument[], error: "The Family Vault is temporarily unavailable." };
  const { data, error } = await supabase.from("vault_documents")
    .select("id,title,category,owner_member_id,visibility,storage_path,expiration_date,notes")
    .eq("household_id", context.householdId).is("archived_at", null).order("created_at", { ascending: false });
  if (error) return { documents: [] as VaultDocument[], error: "The Family Vault could not be loaded safely." };
  const term = search.trim().toLocaleLowerCase();
  const documents = (data ?? []).map((row) => ({
    id: row.id, title: row.title, category: row.category,
    ownerMemberId: row.owner_member_id ?? undefined,
    visibility: row.visibility as VaultDocument["visibility"],
    storagePath: row.storage_path ?? undefined,
    expirationDate: row.expiration_date ?? undefined,
    notes: row.notes ?? undefined,
  })).filter((document) => !term || [document.title, document.category, document.notes].some((value) => value?.toLocaleLowerCase().includes(term)));
  return { documents };
}
