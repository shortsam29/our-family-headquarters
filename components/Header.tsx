import { signOut } from "@/app/auth/actions";
import styles from "./Header.module.css";

export default function Header({ displayName }: { displayName: string }) {
  const initials = displayName.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "FH";
  return (
    <header className={styles.header}>
      <div className={`${styles.brand} type-brand-title`}>Our Family Headquarters</div>
      <form action={signOut}>
        <button className={styles.userMenu} type="submit" aria-label="Sign out">
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <span>Sign out</span>
        </button>
      </form>
    </header>
  );
}
