import type { ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import styles from "./shell.module.css";

export default async function MainApplicationLayout({ children }: { children: ReactNode }) {
  await requireCurrentHouseholdContext();
  return (
    <>
      <Header />
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}
