import Link from "next/link";
import styles from "@/app/create-household/create-household.module.css";

export default function AccountHelpPage() {
  return <main className={styles.page}><section className={styles.card} aria-labelledby="account-help-title">
    <p className={styles.eyebrow}>Account assistance</p>
    <h1 id="account-help-title">Need Help?</h1>
    <p>If you&apos;re unable to sign in, please contact your household administrator.</p>
    <p>Household managers can send members a secure password reset email from Manage Members in Settings.</p>
    <p className={styles.returning}><Link href="/forgot-password">Reset your password</Link> · <Link href="/sign-in">Return to Sign In</Link></p>
  </section></main>;
}
