import Link from "next/link";
import { joinExistingAccount, registerInvitedFamilyMember } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/app/create-household/create-household.module.css";

const messages: Record<string,string> = {
  validation: "Please review the account details and family join code.",
  invitation: "That family join code is unavailable or has expired. Ask your household administrator for a fresh code.",
  "existing-email": "An account already uses that email. Sign in first, then return with the family join code.",
  "weak-password": "Use at least 10 characters with uppercase, lowercase, and a number.",
  "create-failed": "We couldn’t create the account right now. Please try again.",
  "try-later": "There have been several attempts. Please wait a moment and try again.",
  confirmation: "The account was created, but sign-in could not finish. Please sign in and use the same family join code.",
};

export default async function JoinHouseholdPage({ searchParams }: { searchParams: Promise<{error?:string;code?:string}> }) {
  const supabase = await createSupabaseServerClient();
  const auth = supabase ? (await supabase.auth.getUser()).data : { user: null };
  const params = await searchParams;
  const message = params.error ? messages[params.error] ?? messages.invitation : null;
  return <main className={styles.page}><section className={styles.card} aria-labelledby="join-title">
    <p className={styles.eyebrow}>You’re almost home</p>
    <h1 id="join-title">Let’s connect you to your family.</h1>
    <p>Your household administrator controls each invitation. A code can be used once and expires automatically.</p>
    {message ? <p id="join-error" className={styles.error} role="alert">{message}</p> : null}
    {auth.user ? <form action={joinExistingAccount}>
      <label htmlFor="existingInvitationCode">Family join code<input id="existingInvitationCode" name="invitationCode" defaultValue={params.code} required autoCapitalize="characters" autoComplete="one-time-code" /></label>
      <button type="submit">Join my family</button>
    </form> : <form action={registerInvitedFamilyMember}>
      <label htmlFor="invitationCode">Family join code<input id="invitationCode" name="invitationCode" defaultValue={params.code} required autoCapitalize="characters" autoComplete="one-time-code" /></label>
      <p className={styles.guidance}>Enter the private code your household administrator shared with you.</p>
      <div className={styles.nameGrid}>
        <label htmlFor="joinFirstName">First name<input id="joinFirstName" name="firstName" autoComplete="given-name" required maxLength={80} /></label>
        <label htmlFor="joinLastName">Last name <span>(optional)</span><input id="joinLastName" name="lastName" autoComplete="family-name" maxLength={100} /></label>
      </div>
      <label htmlFor="joinEmail">Email<input id="joinEmail" name="email" type="email" autoComplete="email" required /></label>
      <label htmlFor="joinPassword">Password<input id="joinPassword" name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
      <p className={styles.guidance}>Use at least 10 characters, including uppercase, lowercase, and a number.</p>
      <label htmlFor="joinConfirmPassword">Confirm password<input id="joinConfirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
      <button type="submit">Create account and join family</button>
    </form>}
    <p className={styles.returning}><Link href="/sign-in">Return to sign in</Link></p>
  </section></main>;
}
