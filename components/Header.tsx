import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`${styles.brand} type-brand-title`}>Our Family Headquarters</div>
      <button className={styles.userMenu} type="button" aria-label="Open user menu">
        <span className={styles.avatar} aria-hidden="true">F</span>
        <span>User Menu</span>
        <span className={styles.chevron} aria-hidden="true">⌄</span>
      </button>
    </header>
  );
}
