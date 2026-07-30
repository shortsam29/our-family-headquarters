import type { ReactNode } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { QuickAdd } from "@/components/quick-add/QuickAdd";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getManagedHouseholdMembers } from "@/lib/data/core";
import styles from "./shell.module.css";
import { getMyUnreadNotificationCount } from "@/lib/kenzie/notifications/service";
import { toZonedDateIso } from "@/lib/today/date";

export default async function MainApplicationLayout({ children }: { children: ReactNode }) {
  const context = await requireCurrentHouseholdContext();
  const showMomsPlanner = context.displayName.trim().toLowerCase().startsWith("samantha");
  const [unreadNotifications, members] = await Promise.all([
    getMyUnreadNotificationCount(context),
    getManagedHouseholdMembers(context),
  ]);
  const canManage = ["household_manager", "parent"].includes(context.role);
  const today = toZonedDateIso(new Date(), context.timeZone);
  return <><Header displayName={context.displayName} /><div className={styles.shell}><Sidebar showMomsPlanner={showMomsPlanner} unreadNotifications={unreadNotifications}/><div className={styles.content}>{children}</div></div><QuickAdd members={members} today={today} canManage={canManage}/></>;
}
