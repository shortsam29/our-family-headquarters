import { PasswordRecoveryRequestForm } from "@/components/auth/PasswordRecoveryRequestForm";
import styles from "@/app/create-household/create-household.module.css";

export default function ForgotPasswordPage() {
  return <main className={styles.page}><section className={styles.card} aria-labelledby="recovery-title">
    <p className={styles.eyebrow}>Account assistance</p>
    <h1 id="recovery-title">Forgot Your Password?</h1>
    <p>Enter the email address associated with your account and we&apos;ll send you a secure password reset email.</p>
    <PasswordRecoveryRequestForm />
  </section></main>;
}
