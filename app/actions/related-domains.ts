"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const recipeSchema = z.object({
  name: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(5000).optional(),
  ingredients: z.string().trim().max(2000).optional(),
  servings: z.coerce.number().int().positive().max(100).optional(),
});

function manager(role: string) {
  return role === "household_manager" || role === "parent";
}

export async function createRecipe(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!manager(context.role)) redirect("/meals?error=permission");
  const parsed = recipeSchema.safeParse({
    name: formData.get("name"),
    instructions: formData.get("instructions") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    servings: formData.get("servings") || undefined,
  });
  if (!parsed.success) redirect("/meals?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/meals?error=service");
  const { data: recipe, error } = await supabase.from("recipes").insert({
    household_id: context.householdId, name: parsed.data.name,
    instructions: parsed.data.instructions, servings: parsed.data.servings,
    created_by_member_id: context.familyMemberId,
  }).select("id").single();
  if (error || !recipe) redirect("/meals?error=save");
  const ingredients = parsed.data.ingredients?.split(",").map((name) => name.trim()).filter(Boolean) ?? [];
  if (ingredients.length) {
    const { error: ingredientError } = await supabase.from("recipe_ingredients").insert(
      ingredients.map((name) => ({ household_id: context.householdId, recipe_id: recipe.id, name })),
    );
    if (ingredientError) redirect("/meals?error=save");
  }
  revalidatePath("/meals");
  redirect("/meals?status=recipe-saved");
}

export async function removeRecipe(recipeId: string) {
  const context = await requireCurrentHouseholdContext();
  if (!manager(context.role) || !z.uuid().safeParse(recipeId).success) redirect("/meals?error=permission");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/meals?error=service");
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId).eq("household_id", context.householdId);
  if (error) redirect("/meals?error=save");
  revalidatePath("/meals");
  redirect("/meals?status=recipe-removed");
}

export async function createCareReminder(kind: "pets" | "vehicles", formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (!manager(context.role)) redirect(`/${kind}?error=permission`);
  const parsed = z.object({ ownerId: z.uuid(), title: z.string().trim().min(1).max(160), dueDate: z.iso.date().optional(), notes: z.string().trim().max(2000).optional() }).safeParse({
    ownerId: formData.get("ownerId"), title: formData.get("title"),
    dueDate: formData.get("dueDate") || undefined, notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) redirect(`/${kind}?error=validation`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/${kind}?error=service`);
  const ownerTable = kind === "pets" ? "pets" : "vehicles";
  const { data: owner } = await supabase.from(ownerTable).select("id").eq("id", parsed.data.ownerId).eq("household_id", context.householdId).maybeSingle();
  if (!owner) redirect(`/${kind}?error=permission`);
  const table = kind === "pets" ? "pet_care_reminders" : "vehicle_reminders";
  const ownerField = kind === "pets" ? "pet_id" : "vehicle_id";
  const { error } = await supabase.from(table).insert({
    household_id: context.householdId, [ownerField]: parsed.data.ownerId,
    title: parsed.data.title, due_date: parsed.data.dueDate, notes: parsed.data.notes,
    ...(kind === "vehicles" ? { reminder_type: "maintenance" } : {}),
  });
  if (error) redirect(`/${kind}?error=save`);
  revalidatePath(`/${kind}`);
  redirect(`/${kind}?status=reminder-saved`);
}

export async function setCareReminderStatus(kind: "pets" | "vehicles", reminderId: string, completed: boolean) {
  const context = await requireCurrentHouseholdContext();
  if (!manager(context.role) || !z.uuid().safeParse(reminderId).success) redirect(`/${kind}?error=permission`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/${kind}?error=service`);
  const table = kind === "pets" ? "pet_care_reminders" : "vehicle_reminders";
  const { error } = await supabase.from(table).update({ status: completed ? "completed" : "active" }).eq("id", reminderId).eq("household_id", context.householdId);
  if (error) redirect(`/${kind}?error=save`);
  revalidatePath(`/${kind}`);
}
