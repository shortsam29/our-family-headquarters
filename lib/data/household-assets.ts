import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HouseholdAssetSummary = {
  id: string;
  kind: "pet" | "vehicle" | "contact";
  name: string;
  summary: string;
  access: "household" | "adults";
};

export async function getHouseholdAssetSummaries(context: CurrentHouseholdContext) {
  if (context.source !== "supabase") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const [pets, vehicles, contacts] = await Promise.all([
    supabase.from("pets").select("id,name,species").eq("household_id", context.householdId).eq("active", true).limit(4),
    supabase.from("vehicles").select("id,name,make,model").eq("household_id", context.householdId).eq("active", true).limit(4),
    supabase.from("household_contacts").select("id,name,category,visibility").eq("household_id", context.householdId).limit(4),
  ]);
  return [
    ...(pets.data ?? []).map((row): HouseholdAssetSummary => ({ id: row.id, kind: "pet", name: row.name, summary: row.species ?? "Household pet", access: "household" })),
    ...(vehicles.data ?? []).map((row): HouseholdAssetSummary => ({ id: row.id, kind: "vehicle", name: row.name, summary: [row.make, row.model].filter(Boolean).join(" ") || "Household vehicle", access: "household" })),
    ...(contacts.data ?? []).map((row): HouseholdAssetSummary => ({ id: row.id, kind: "contact", name: row.name, summary: row.category ?? "Household contact", access: row.visibility === "adults" ? "adults" : "household" })),
  ];
}
