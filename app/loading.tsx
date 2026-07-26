import styles from "./status.module.css";

export default function Loading() {
  return <main className={styles.page} aria-busy="true" aria-live="polite"><section className={styles.card}><p className={styles.eyebrow}>Our Family Headquarters</p><h1>Getting your family home ready...</h1><p>Just a moment while everything comes together.</p></section></main>;
}