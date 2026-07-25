"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { displayName, registrationErrorCode, registrationSchema } from "@/lib/auth/registration";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(200),
});

export async function signIn(formData: FormData) {
  const credentials = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!credentials.success) redirect("/sign-in?error=invalid");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in?status=configuration");
  const { data, error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error || !data.user) redirect("/sign-in?error=credentials");
  const { data: membership } = await supabase.from("household_memberships").select("id").eq("user_id", data.user.id).eq("status", "active").maybeSingle();
  redirect(membership ? "/" : "/onboarding");
}

export async function registerHouseholdAdministrator(formData: FormData) {
  const registration = registrationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!registration.success) redirect("/create-household?error=validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in?status=configuration");
  const name = displayName(registration.data.firstName, registration.data.lastName);
  const { data, error } = await supabase.auth.signUp({
    email: registration.data.email,
    password: registration.data.password,
    options: { data: { first_name: registration.data.firstName, last_name: registration.data.lastName ?? "", display_name: name } },
  });
  if (error) redirect(`/create-household?error=${registrationErrorCode(error.message)}`);
  if (!data.user || data.user.identities?.length === 0) redirect("/create-household?error=existing-email");
  if (!data.session) {
    const signInResult = await supabase.auth.signInWithPassword({ email: registration.data.email, password: registration.data.password });
    if (signInResult.error || !signInResult.data.session) redirect("/create-household?error=confirmation");
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/sign-in");
}
