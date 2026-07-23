import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Header />
      <div className={styles.applicationShell}>
        <Sidebar />
        <main className={styles.mainContent}>
          <h1>🏡 Our Family Headquarters</h1>

          <p>Your family&apos;s command center.</p>

          <button className={styles.dashboardButton}>Enter Dashboard</button>
        </main>
      </div>
    </>
  );
}
