"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDomainSlug, type DomainSlug } from "@/types/domains";

const idSchema = z.uuid();
const baseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000).optional(),
});

function canManage(role: string) {
  return role === "household_manager" || role === "parent";
}

function route(slug: DomainSlug, status: "saved" | "removed" | "error"): never {
  redirect(`/${slug}?${status === "error" ? "error=save" : `status=${status}`}`);
}

function mondayIso(dateValue?: string) {
  const value = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export async function createDomainRecord(slugValue: string, formData: FormData) {
  if (!isDomainSlug(slugValue)) return;
  const slug = slugValue;
  const context = await requireCurrentHouseholdContext();
  if (slug !== "shopping" && !canManage(context.role)) route(slug, "error");
  const parsed = baseSchema.safeParse({ title: formData.get("title"), notes: formData.get("notes") || undefined });
  if (!parsed.success) route(slug, "error");
  const supabase = await createSupabaseServerClient();
  if (!supabase) route(slug, "error");
  const common = { household_id: context.householdId };
  let error: { message: string } | null = null;

  if (slug === "meals") {
    const date = z.iso.date().safeParse(formData.get("date"));
    const mealType = z.enum(["breakfast", "lunch", "dinner", "snack"]).safeParse(formData.get("mealType"));
    if (!date.success || !mealType.success) route(slug, "error");
    const { data: plan, error: planError } = await supabase.from("meal_plans").upsert({
      ...common, week_start: mondayIso(date.data), created_by_member_id: context.familyMemberId,
    }, { onConflict: "household_id,week_start" }).select("id").single();
    if (planError || !plan) route(slug, "error");
    ({ error } = await supabase.from("meal_plan_entries").upsert({
      ...common, meal_plan_id: plan.id, planned_date: date.data, meal_type: mealType.data,
      name: parsed.data.title, notes: parsed.data.notes, status: "planned",
    }, { onConflict: "meal_plan_id,planned_date,meal_type" }));
  } else if (slug === "shopping") {
    const listType = z.enum(["grocery", "household"]).safeParse(formData.get("listType"));
    if (!listType.success) route(slug, "error");
    const listName = String(formData.get("listName") || "").trim() || (listType.data === "grocery" ? "Groceries" : "Household Shopping");
    const { data: list, error: listError } = await supabase.from("shopping_lists").upsert({
      ...common, name: listName, list_type: listType.data, created_by_member_id: context.familyMemberId,
    }, { onConflict: "household_id,name,list_type" }).select("id").single();
    if (listError || !list) route(slug, "error");
    ({ error } = await supabase.from("shopping_list_items").insert({
      ...common, shopping_list_id: list.id, name: parsed.data.title, notes: parsed.data.notes,
      category: String(formData.get("category") || "").trim() || null,
      quantity: String(formData.get("quantity") || "").trim() || null,
      priority: ["low", "normal", "high"].includes(String(formData.get("priority"))) ? String(formData.get("priority")) : "normal",
      added_by_member_id: context.familyMemberId,
    }));
  } else if (slug === "pets") {
    const species = z.string().trim().min(1).max(80).safeParse(formData.get("species"));
    if (!species.success) route(slug, "error");
    ({ error } = await supabase.from("pets").insert({ ...common, name: parsed.data.title, species: species.data, breed: String(formData.get("breed") || "").trim() || null, notes: parsed.data.notes }));
  } else if (slug === "contacts") {
    ({ error } = await supabase.from("household_contacts").insert({
      ...common, name: parsed.data.title, category: String(formData.get("category") || "general"),
      phone: String(formData.get("phone") || "").trim() || null, email: String(formData.get("email") || "").trim() || null,
      is_emergency: formData.get("emergency") === "on",
      visibility: formData.get("visibility") === "adults" ? "adults" : "household", notes: parsed.data.notes,
    }));
  } else if (slug === "vehicles") {
    const yearValue = String(formData.get("year") || "");
    ({ error } = await supabase.from("vehicles").insert({
      ...common, name: parsed.data.title, make: String(formData.get("make") || "").trim() || null,
      model: String(formData.get("model") || "").trim() || null,
      model_year: yearValue ? Number(yearValue) : null, notes: parsed.data.notes,
    }));
  } else if (slug === "documents") {
    ({ error } = await supabase.from("vault_documents").insert({
      ...common, title: parsed.data.title, category: String(formData.get("category") || "Household"),
      owner_member_id: context.familyMemberId, visibility: formData.get("visibility") === "household" ? "household" : "adults",
      expiration_date: formData.get("date") || null, notes: parsed.data.notes,
    }));
  } else {
    const amountValue = String(formData.get("amount") || "");
    ({ error } = await supabase.from("finance_obligations").insert({
      ...common, title: parsed.data.title, kind: formData.get("kind") === "subscription" ? "subscription" : "bill",
      category: String(formData.get("category") || "").trim() || null,
      amount: amountValue ? Number(amountValue) : null, due_date: formData.get("date") || null,
      recurrence: String(formData.get("recurrence") || "").trim() || null, notes: parsed.data.notes,
    }));
  }
  if (error) route(slug, "error");
  revalidatePath(`/${slug}`);
  revalidatePath("/");
  route(slug, "saved");
}

export async function updateDomainRecord(slugValue: string, recordId: string, formData: FormData) {
  if (!isDomainSlug(slugValue) || !idSchema.safeParse(recordId).success) return;
  const slug = slugValue;
  const context = await requireCurrentHouseholdContext();
  if (slug !== "shopping" && !canManage(context.role)) route(slug, "error");
  const parsed = baseSchema.safeParse({ title: formData.get("title"), notes: formData.get("notes") || undefined });
  if (!parsed.success) route(slug, "error");
  const supabase = await createSupabaseServerClient();
  if (!supabase) route(slug, "error");
  const table = {
    meals: "meal_plan_entries", shopping: "shopping_list_items", pets: "pets",
    contacts: "household_contacts", vehicles: "vehicles", documents: "vault_documents",
    finance: "finance_obligations",
  }[slug];
  const titleField = slug === "documents" || slug === "finance" ? "title" : "name";
  const { error } = await supabase.from(table).update({ [titleField]: parsed.data.title, notes: parsed.data.notes ?? null })
    .eq("id", recordId).eq("household_id", context.householdId);
  if (error) route(slug, "error");
  revalidatePath(`/${slug}`);
  revalidatePath("/");
  route(slug, "saved");
}

export async function removeDomainRecord(slugValue: string, recordId: string) {
  if (!isDomainSlug(slugValue) || !idSchema.safeParse(recordId).success) return;
  const slug = slugValue;
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) route(slug, "error");
  const supabase = await createSupabaseServerClient();
  if (!supabase) route(slug, "error");
  const table = {
    meals: "meal_plan_entries", shopping: "shopping_list_items", pets: "pets",
    contacts: "household_contacts", vehicles: "vehicles", documents: "vault_documents",
    finance: "finance_obligations",
  }[slug];
  const { error } = await supabase.from(table).delete().eq("id", recordId).eq("household_id", context.householdId);
  if (error) route(slug, "error");
  revalidatePath(`/${slug}`);
  revalidatePath("/");
  route(slug, "removed");
}

export async function toggleFinanceStatus(recordId: string, paid: boolean) {
  if (!idSchema.safeParse(recordId).success) return;
  const context = await requireCurrentHouseholdContext();
  if (!canManage(context.role)) route("finance", "error");
  const supabase = await createSupabaseServerClient();
  if (!supabase) route("finance", "error");
  const { error } = await supabase.from("finance_obligations").update({ status: paid ? "paid" : "upcoming" }).eq("id", recordId).eq("household_id", context.householdId);
  if (error) route("finance", "error");
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function clearCompletedShoppingItems() {
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) route("shopping", "error");
  const { error } = await supabase.from("shopping_list_items").delete().eq("household_id", context.householdId).eq("status", "purchased");
  if (error) route("shopping", "error");
  revalidatePath("/shopping");
  revalidatePath("/");
}

export async function toggleShoppingItem(recordId: string, completed: boolean) {
  if (!idSchema.safeParse(recordId).success) return;
  const context = await requireCurrentHouseholdContext();
  const supabase = await createSupabaseServerClient();
  if (!supabase) route("shopping", "error");
  const { error } = await supabase.from("shopping_list_items").update({
    status: completed ? "purchased" : "needed",
    purchased_by_member_id: completed ? context.familyMemberId : null,
    purchased_at: completed ? new Date().toISOString() : null,
  }).eq("id", recordId).eq("household_id", context.householdId);
  if (error) route("shopping", "error");
  revalidatePath("/shopping");
  revalidatePath("/");
}
