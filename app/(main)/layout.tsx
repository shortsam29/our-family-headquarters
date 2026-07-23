import type { ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import styles from "./shell.module.css";

export default function MainApplicationLayout({ children }: { children: ReactNode }) {
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
