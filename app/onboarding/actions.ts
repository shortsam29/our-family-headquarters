"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  householdName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(100),
  timeZone: z.string().trim().min(1).max(100),
});

export async function createFirstHousehold(formData: FormData) {
  const parsed = schema.safeParse({
    householdName: formData.get("householdName"),
    displayName: formData.get("displayName"),
    timeZone: formData.get("timeZone"),
  });
  if (!parsed.success) redirect("/onboarding?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in?status=configuration");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/sign-in?next=/onboarding");
  const { error } = await supabase.rpc("create_first_household", {
    household_name: parsed.data.householdName,
    member_display_name: parsed.data.displayName,
    household_time_zone: parsed.data.timeZone,
  });
  if (error) redirect("/onboarding?error=save");
  redirect("/settings?setup=1");
}
