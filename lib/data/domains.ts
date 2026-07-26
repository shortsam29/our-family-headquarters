import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DomainRecord, DomainRoomData, DomainSlug } from "@/types/domains";

type Row = Record<string, unknown>;

const text = (value: unknown) => typeof value === "string" ? value : undefined;
const id = (row: Row) => String(row.id);

function mapRow(slug: DomainSlug, row: Row): DomainRecord {
  if (slug === "meals") return {
    id: id(row), kind: "Meal", title: text(row.name) ?? "Meal",
    detail: text(row.meal_type), date: text(row.planned_date),
    status: text(row.status), notes: text(row.notes),
  };
  if (slug === "shopping") return {
    id: id(row), kind: text((row.shopping_lists as Row | null)?.list_type) === "grocery" ? "Grocery" : "Household shopping",
    title: text(row.name) ?? "Shopping item",
    detail: [row.quantity, text(row.unit)].filter(Boolean).join(" "),
    status: text(row.status), notes: text(row.notes),
  };
  if (slug === "pets") return {
    id: id(row), kind: "Pet", title: text(row.name) ?? "Pet",
    detail: [text(row.species), text(row.breed)].filter(Boolean).join(" · "),
    notes: text(row.notes),
  };
  if (slug === "contacts") return {
    id: id(row), kind: row.is_emergency ? "Emergency contact" : text(row.category) ?? "Contact",
    title: text(row.name) ?? "Contact",
    detail: text(row.phone) ?? text(row.email), status: text(row.visibility), notes: text(row.notes),
  };
  if (slug === "vehicles") return {
    id: id(row), kind: "Vehicle", title: text(row.name) ?? "Vehicle",
    detail: [row.model_year, text(row.make), text(row.model)].filter(Boolean).join(" "),
    notes: text(row.notes),
  };
  if (slug === "documents") return {
    id: id(row), kind: text(row.category) ?? "Document", title: text(row.title) ?? "Document",
    date: text(row.expiration_date), status: text(row.visibility), notes: text(row.notes),
  };
  return {
    id: id(row), kind: text(row.kind) ?? "Financial item", title: text(row.title) ?? "Financial item",
    detail: row.amount == null ? undefined : `$${Number(row.amount).toFixed(2)}`,
    date: text(row.due_date), status: text(row.status), notes: text(row.notes),
  };
}

export async function getDomainRoomData(
  context: CurrentHouseholdContext,
  slug: DomainSlug,
  shoppingType?: "grocery" | "household",
): Promise<DomainRoomData> {
  if (context.source === "development-fixture") return { records: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { records: [], error: "This room is temporarily unavailable." };

  const query = slug === "meals"
    ? supabase.from("meal_plan_entries").select("id,name,meal_type,planned_date,status,notes")
    : slug === "shopping"
      ? supabase.from("shopping_list_items").select("id,name,quantity,unit,status,notes,shopping_lists!inner(list_type)")
      : slug === "pets"
        ? supabase.from("pets").select("id,name,species,breed,notes").eq("active", true)
        : slug === "contacts"
          ? supabase.from("household_contacts").select("id,name,category,phone,email,is_emergency,visibility,notes")
          : slug === "vehicles"
            ? supabase.from("vehicles").select("id,name,make,model,model_year,notes").eq("active", true)
            : slug === "documents"
              ? supabase.from("vault_documents").select("id,title,category,expiration_date,visibility,notes").is("archived_at", null)
              : supabase.from("finance_obligations").select("id,title,kind,amount,due_date,status,notes").neq("status", "archived");

  const scopedQuery = slug === "shopping" && shoppingType ? query.eq("shopping_lists.list_type", shoppingType) : query;
  const { data, error } = await scopedQuery.eq("household_id", context.householdId).order("created_at", { ascending: false });
  if (error) return { records: [], error: "This room could not be loaded safely." };
  return { records: (data ?? []).map((row) => mapRow(slug, row as Row)) };
}

export async function getDomainSignals(context: CurrentHouseholdContext) {
  if (context.source !== "supabase") return { meal: undefined, shopping: 0, grocery: 0, bills: 0, documents: 0, petCare: 0, vehicleCare: 0 };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { meal: undefined, shopping: 0, grocery: 0, bills: 0, documents: 0, petCare: 0, vehicleCare: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [meal, shopping, grocery, bills, documents, petCare, vehicleCare] = await Promise.all([
    supabase.from("meal_plan_entries").select("name").eq("household_id", context.householdId).eq("planned_date", today).eq("meal_type", "dinner").maybeSingle(),
    supabase.from("shopping_list_items").select("id,shopping_lists!inner(list_type)", { count: "exact", head: true }).eq("household_id", context.householdId).eq("status", "needed").eq("shopping_lists.list_type", "household"),
    supabase.from("shopping_list_items").select("id,shopping_lists!inner(list_type)", { count: "exact", head: true }).eq("household_id", context.householdId).eq("status", "needed").eq("shopping_lists.list_type", "grocery"),
    supabase.from("finance_obligations").select("id", { count: "exact", head: true }).eq("household_id", context.householdId).eq("status", "upcoming").lte("due_date", soon),
    supabase.from("vault_documents").select("id", { count: "exact", head: true }).eq("household_id", context.householdId).is("archived_at", null).lte("expiration_date", soon),
    supabase.from("pet_care_reminders").select("id", { count: "exact", head: true }).eq("household_id", context.householdId).eq("status", "active").lte("due_date", soon),
    supabase.from("vehicle_reminders").select("id", { count: "exact", head: true }).eq("household_id", context.householdId).eq("status", "active").lte("due_date", soon),
  ]);
  const adult = context.role === "household_manager" || context.role === "parent";
  return {
    meal: meal.data?.name,
    shopping: shopping.count ?? 0,
    grocery: grocery.count ?? 0,
    bills: adult ? bills.count ?? 0 : 0,
    documents: adult ? documents.count ?? 0 : 0,
    petCare: petCare.count ?? 0,
    vehicleCare: vehicleCare.count ?? 0,
  };
}
