import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DomainSlug } from "@/types/domains";

export type RelatedRecord = {
  id: string;
  ownerId?: string;
  ownerName?: string;
  title: string;
  detail?: string;
  date?: string;
  status?: string;
};

export async function getRelatedDomainData(context: CurrentHouseholdContext, slug: DomainSlug): Promise<RelatedRecord[]> {
  if (context.source !== "supabase" || !["meals", "pets", "vehicles"].includes(slug)) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  if (slug === "meals") {
    const { data } = await supabase.from("recipes").select("id,name,servings,preparation_minutes").eq("household_id", context.householdId).order("name");
    return (data ?? []).map((row) => ({ id: row.id, title: row.name, detail: [row.servings ? `${row.servings} servings` : null, row.preparation_minutes ? `${row.preparation_minutes} minutes` : null].filter(Boolean).join(" · ") }));
  }
  if (slug === "pets") {
    const { data } = await supabase.from("pet_care_reminders").select("id,pet_id,title,due_date,status,pets!inner(name)").eq("household_id", context.householdId).order("due_date");
    return (data ?? []).map((row) => ({ id: row.id, ownerId: row.pet_id, ownerName: (row.pets as unknown as { name: string }).name, title: row.title, date: row.due_date ?? undefined, status: row.status }));
  }
  const { data } = await supabase.from("vehicle_reminders").select("id,vehicle_id,title,due_date,status,vehicles!inner(name)").eq("household_id", context.householdId).order("due_date");
  return (data ?? []).map((row) => ({ id: row.id, ownerId: row.vehicle_id, ownerName: (row.vehicles as unknown as { name: string }).name, title: row.title, date: row.due_date ?? undefined, status: row.status }));
}
