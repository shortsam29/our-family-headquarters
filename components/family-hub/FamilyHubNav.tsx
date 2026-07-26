"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./FamilyHubNav.module.css";
const tabs=[
  ["Conversations & Announcements","/family-hub"], ["Pets","/family-hub/pets"], ["Important Contacts","/family-hub/contacts"],
  ["Family Vault","/family-hub/documents"], ["Vehicles & Maintenance","/family-hub/vehicles"], ["Household Finances","/family-hub/finances"],
  ["Household Passwords","/family-hub/passwords"], ["Recipes","/family-hub/recipes"], ["Vacations","/family-hub/vacations"],
] as const;
export function FamilyHubNav(){const path=usePathname();return <nav className={styles.tabs} aria-label="Family Hub rooms">{tabs.map(([label,href])=><Link key={href} href={href} aria-current={path===href?"page":undefined}>{label}</Link>)}</nav>}
