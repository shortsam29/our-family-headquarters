import Link from "next/link";
import { registerHouseholdAdministrator } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import styles from "./create-household.module.css";

const errorMessages: Record<string, string> = {
  validation: "Please review the highlighted account details.",
  "existing-email": "An account already uses that email. Sign in instead, or use a different email.",
  "weak-password": "That password needs a little more strength. Use at least 10 characters with uppercase, lowercase, and a number.",
  "create-failed": "We couldn’t create the account right now. Please try again.",
  "try-later": "There have been several attempts. Please wait a moment and try again.",
  confirmation: "The account was created, but sign-in could not finish. Please use the sign-in page.",
};

export default async function CreateHouseholdPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in?status=configuration");
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) redirect("/onboarding");
  const { error } = await searchParams;
  const message = error ? errorMessages[error] ?? errorMessages["create-failed"] : null;
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="registration-title">
      <p className={styles.eyebrow}>Create your family home</p>
      <h1 id="registration-title">First, create your administrator account.</h1>
      <p>This secure account will manage the household and guide the rest of setup.</p>
      {message ? <p id="registration-error" className={styles.error} role="alert">{message}</p> : null}
      <form action={registerHouseholdAdministrator} aria-describedby={message ? "registration-error password-guidance" : "password-guidance"}>
        <div className={styles.nameGrid}>
          <label htmlFor="firstName">First name<input id="firstName" name="firstName" autoComplete="given-name" required maxLength={80} /></label>
          <label htmlFor="lastName">Last name <span>(optional)</span><input id="lastName" name="lastName" autoComplete="family-name" maxLength={100} /></label>
        </div>
        <label htmlFor="registrationEmail">Email<input id="registrationEmail" name="email" type="email" autoComplete="email" inputMode="email" required /></label>
        <label htmlFor="newPassword">Password<input id="newPassword" name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
        <p id="password-guidance" className={styles.guidance}>Use at least 10 characters, including uppercase, lowercase, and a number.</p>
        <label htmlFor="confirmPassword">Confirm password<input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button type="submit">Continue to household setup</button>
      </form>
      <p className={styles.returning}>Already have an account? <Link href="/sign-in">Sign in to your family home</Link>.</p>
    </section>
  </main>;
}
