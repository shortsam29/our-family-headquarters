import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import styles from "./sign-in.module.css";

type SignInPageProps = { searchParams: Promise<{ error?: string; status?: string }> };

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const message = params.status === "configuration"
    ? "This home has not been connected to its secure service yet."
    : params.status === "password-updated"
      ? "Your password has been updated. Sign in with your new password."
      : params.error ? "We could not sign you in with those details. Please try again." : null;
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="sign-in-title">
      <p className={styles.eyebrow}>Welcome home</p>
      <h1 id="sign-in-title">Sign in to your family home</h1>
      <p>Your household information stays private and is available only to approved family members.</p>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
      <form action={signIn}>
        <label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
        <button type="submit">Sign in</button>
        <nav className={styles.assistance} aria-label="Account assistance"><Link href="/forgot-password">Forgot Password?</Link><Link href="/account-help">Need Help?</Link></nav>
      </form>
      <div className={styles.newHousehold}>
        <span aria-hidden="true" />
        <h2>New to Our Family Headquarters?</h2>
        <p>Create your family&apos;s headquarters.</p>
        <Link href="/create-household">Create Household</Link>
        <p>Already have a family join code?</p>
        <Link href="/join-household">Join your family</Link>
      </div>
    </section>
  </main>;
}
