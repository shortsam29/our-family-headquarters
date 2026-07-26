import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BrainDumpNote = { id: string; title?: string; note: string; createdAt: string };
export type WishListItem = { id: string; itemName: string; storeWebsite?: string; notes?: string; createdAt: string };
export type FamilyWishListGroup = { memberId: string; displayName: string; items: WishListItem[] };

function mapWishItem(row: { id: string; item_name: string; store_website: string | null; notes: string | null; created_at: string }): WishListItem {
  return { id: row.id, itemName: row.item_name, storeWebsite: row.store_website ?? undefined, notes: row.notes ?? undefined, createdAt: row.created_at };
}

export async function getPrivatePersonalTools(context: CurrentHouseholdContext): Promise<{ brainNotes: BrainDumpNote[]; wishItems: WishListItem[]; error?: string }> {
  if (context.source !== "supabase") return { brainNotes: [], wishItems: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { brainNotes: [], wishItems: [], error: "Your private notes are temporarily unavailable." };
  const [brain, wish] = await Promise.all([
    supabase.from("personal_brain_dump_notes").select("id,title,note,created_at").eq("household_id", context.householdId).eq("owner_user_id", context.userId).order("created_at", { ascending: false }),
    supabase.from("personal_wish_list_items").select("id,item_name,store_website,notes,created_at").eq("household_id", context.householdId).eq("owner_user_id", context.userId).order("created_at", { ascending: false }),
  ]);
  if (brain.error || wish.error) return { brainNotes: [], wishItems: [], error: "Your private notes are temporarily unavailable." };
  return {
    brainNotes: (brain.data ?? []).map((row) => ({ id: row.id, title: row.title ?? undefined, note: row.note, createdAt: row.created_at })),
    wishItems: (wish.data ?? []).map(mapWishItem),
  };
}

export async function getFamilyWishListDashboard(context: CurrentHouseholdContext): Promise<{ groups: FamilyWishListGroup[]; error?: string }> {
  if (context.source !== "supabase" || !context.displayName.toLocaleLowerCase().startsWith("samantha")) return { groups: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { groups: [], error: "Family wish lists are temporarily unavailable." };
  const [members, wishes] = await Promise.all([
    supabase.from("family_members").select("id,display_name,linked_user_id").eq("household_id", context.householdId).eq("status", "active").order("display_name"),
    supabase.from("personal_wish_list_items").select("id,owner_user_id,item_name,store_website,notes,created_at").eq("household_id", context.householdId).order("created_at", { ascending: false }),
  ]);
  if (members.error || wishes.error) return { groups: [], error: "Family wish lists are temporarily unavailable." };
  const itemsByOwner = new Map<string, WishListItem[]>();
  for (const row of wishes.data ?? []) {
    const current = itemsByOwner.get(row.owner_user_id) ?? [];
    current.push(mapWishItem(row));
    itemsByOwner.set(row.owner_user_id, current);
  }
  return {
    groups: (members.data ?? []).map((member) => ({
      memberId: member.id,
      displayName: member.display_name,
      items: member.linked_user_id ? itemsByOwner.get(member.linked_user_id) ?? [] : [],
    })),
  };
}
