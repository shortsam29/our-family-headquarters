import { signOut } from "@/app/auth/actions";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`${styles.brand} type-brand-title`}>Our Family Headquarters</div>
      <form action={signOut}>
        <button className={styles.userMenu} type="submit" aria-label="Sign out">
          <span className={styles.avatar} aria-hidden="true">F</span>
          <span>Sign out</span>
        </button>
      </form>
    </header>
  );
}
