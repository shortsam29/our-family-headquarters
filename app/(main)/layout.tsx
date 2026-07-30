import type { ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import styles from "./shell.module.css";
import { getMyUnreadNotificationCount } from "@/lib/kenzie/notifications/service";

export default async function MainApplicationLayout({ children }: { children: ReactNode }) {
  const context = await requireCurrentHouseholdContext();
  const showMomsPlanner = context.displayName.trim().toLowerCase().startsWith("samantha");
  const unreadNotifications = await getMyUnreadNotificationCount(context);
  return <><Header displayName={context.displayName} /><div className={styles.shell}><Sidebar showMomsPlanner={showMomsPlanner} unreadNotifications={unreadNotifications}/><div className={styles.content}>{children}</div></div></>;
}
