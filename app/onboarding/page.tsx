import { createFirstHousehold } from "@/app/onboarding/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./onboarding.module.css";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in?status=configuration");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/sign-in?next=/onboarding");
  const { data: membership } = await supabase.from("household_memberships").select("id").eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (membership) redirect("/");
  const { error } = await searchParams;
  const savedName = typeof auth.user.user_metadata?.display_name === "string" ? auth.user.user_metadata.display_name : "";
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="onboarding-title">
      <p className={styles.eyebrow}>Create your family home</p>
      <h1 id="onboarding-title">A calm place for family life begins here.</h1>
      <p>Your administrator account is ready. Now name the household and create the first family-member profile.</p>
      {error ? <p role="alert">We couldn’t create the household. Please review the details and try again.</p> : null}
      <form action={createFirstHousehold}>
        <label>Household name<input name="householdName" required maxLength={120} autoComplete="organization" /></label>
        <label>Administrator profile name<input name="displayName" defaultValue={savedName} required maxLength={100} autoComplete="name" /></label>
        <label>Household time zone<select name="timeZone" defaultValue="America/New_York"><option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Los_Angeles</option><option>UTC</option></select></label>
        <button type="submit">Create family home</button>
      </form>
    </section>
  </main>;
}
