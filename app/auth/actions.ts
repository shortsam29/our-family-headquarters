"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(200),
});

export async function signIn(formData: FormData) {
  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!credentials.success) redirect("/sign-in?error=invalid");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in?status=configuration");
  const { data, error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error || !data.user) redirect("/sign-in?error=credentials");
  const { data: membership } = await supabase
    .from("household_memberships")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .maybeSingle();
  redirect(membership ? "/" : "/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/sign-in");
}
