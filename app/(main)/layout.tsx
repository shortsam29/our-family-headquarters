import type { ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import styles from "./shell.module.css";

export default async function MainApplicationLayout({ children }: { children: ReactNode }) {
  const context = await requireCurrentHouseholdContext();
  const showMomsPlanner = context.displayName.trim().toLowerCase().startsWith("samantha");
  return <><Header displayName={context.displayName} /><div className={styles.shell}><Sidebar showMomsPlanner={showMomsPlanner}/><div className={styles.content}>{children}</div></div></>;
}
