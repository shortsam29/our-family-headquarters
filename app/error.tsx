"use client";

import { useEffect } from "react";
import styles from "./status.module.css";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application route error", error.digest ?? error.name); }, [error]);
  return <main className={styles.page}><section className={styles.card} role="alert"><p className={styles.eyebrow}>A small pause</p><h1>This part of your family home is unavailable right now.</h1><p>Nothing has been changed. Please try again when you are ready.</p><button onClick={reset}>Try again</button></section></main>;
}