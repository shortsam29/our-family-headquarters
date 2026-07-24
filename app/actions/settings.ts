"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const householdPreferencesSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timeZone: z.string().trim().min(1).max(100),
});

export async function updateHouseholdPreferences(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (context.role !== "household_manager") redirect("/settings?error=permission");
  const values = householdPreferencesSchema.safeParse({
    name: formData.get("name"),
    timeZone: formData.get("timeZone"),
  });
  if (!values.success) redirect("/settings?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/settings?error=service");
  const { error } = await supabase
    .from("households")
    .update({ name: values.data.name, time_zone: values.data.timeZone })
    .eq("id", context.householdId);
  if (error) redirect("/settings?error=save");
  revalidatePath("/");
  revalidatePath("/household");
  revalidatePath("/settings");
  redirect("/settings?status=saved");
}
