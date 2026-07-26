import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import styles from "@/app/create-household/create-household.module.css";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className={styles.page}><section className={styles.card} aria-labelledby="new-password-title">
    <p className={styles.eyebrow}>Secure account recovery</p>
    <h1 id="new-password-title">Create a New Password</h1>
    <p>Choose a strong password that is easy for you to remember and difficult for anyone else to guess.</p>
    <NewPasswordForm initialError={params.error} />
  </section></main>;
}
