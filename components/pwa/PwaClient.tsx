"use client";

import { useEffect, useState } from "react";
import styles from "./PwaClient.module.css";

export default function PwaClient() {
  const [online, setOnline] = useState(true);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    const initialStatus = window.setTimeout(() => setOnline(navigator.onLine), 0);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const handleOffline = () => { setOnline(false); setReconnected(false); };
    const handleOnline = () => {
      setOnline(true);
      setReconnected(true);
      window.setTimeout(() => setReconnected(false), 4000);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.clearTimeout(initialStatus);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!online) return <div className={styles.offline} role="status">You’re offline. Saved household information is protected, and changes will be available when the connection returns.</div>;
  if (reconnected) return <div className={styles.online} role="status">You’re connected again. The family home is ready.</div>;
  return null;
}
