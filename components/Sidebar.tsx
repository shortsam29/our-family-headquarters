"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const navigationItems: Array<{ label: string; subtitle?: string; href: string; icon: string }> = [
  { label: "Today’s Headquarters", subtitle: "Everything your family needs today.", href: "/", icon: "home" },
  { label: "Schedule", href: "/schedule", icon: "calendar" },
  { label: "Family Hub", href: "/family-hub", icon: "family" },
  { label: "My Day", href: "/my-day", icon: "person" },
  { label: "Kenzie", href: "/kenzie", icon: "heart" },
  { label: "More", href: "/more", icon: "more" },
];

const moreDestinationPaths = new Set(["/contacts","/documents","/finance","/household","/meals","/pets","/settings","/shopping","/vehicles"]);

function NavigationIcon({ name }: { name: string }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
  if (name === "family") return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.6-.5 5.7 1.2 6.3 4.5" /></svg>;
  if (name === "person") return <svg {...common}><circle cx="12" cy="7" r="4" /><path d="M4.5 21c.5-5.2 3-7.8 7.5-7.8s7 2.6 7.5 7.8z" /></svg>;
  if (name === "heart") return <svg {...common}><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
}

export default function Sidebar() {
  const pathname = usePathname();
  return <aside className={styles.sidebar}>
    <nav aria-label="Primary navigation"><ul className={styles.navigationList}>
      {navigationItems.map((item) => {
        const isCurrent = item.href === "/" ? pathname === "/" : pathname === item.href || (item.href === "/more" && moreDestinationPaths.has(pathname));
        return <li key={item.label}><Link className={styles.navigationLink} href={item.href} aria-current={isCurrent ? "page" : undefined}>
          <NavigationIcon name={item.icon} /><span className={styles.navigationCopy}><strong>{item.label}</strong>{item.subtitle ? <small>{item.subtitle}</small> : null}</span>
        </Link></li>;
      })}
    </ul></nav>
    <div className={styles.sidebarWelcome} aria-hidden="true">
      <svg className={styles.plantIllustration} viewBox="0 0 150 250" fill="none">
        <ellipse cx="75" cy="229" rx="55" ry="8" fill="currentColor" opacity=".09" />
        <path d="M75 176V35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M75 72C58 62 48 49 42 34M75 102C94 91 106 77 113 59M75 128C56 119 42 105 35 88M75 151C94 141 108 126 116 109" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M43 35C26 31 17 39 18 51C31 56 42 50 43 35ZM112 59C128 54 138 61 138 73C126 80 114 74 112 59ZM36 88C19 84 10 92 12 105C25 110 36 103 36 88ZM115 109C132 104 142 112 140 125C127 131 116 124 115 109Z" fill="var(--color-sage)" />
        <path d="M75 76C89 70 96 58 95 45C82 43 74 55 75 76ZM75 118C60 112 52 100 53 87C67 85 75 97 75 118ZM75 145C88 139 95 128 94 116C82 114 74 125 75 145Z" fill="var(--color-light-sage)" />
        <path d="M42 169H108L101 218C99 228 90 235 80 235H70C60 235 51 228 49 218L42 169Z" fill="var(--color-warm-taupe)" />
        <path d="M39 168C39 162 44 158 50 158H100C106 158 111 162 111 168V174H39V168Z" fill="var(--color-soft-white)" stroke="var(--color-border)" strokeWidth="2" />
      </svg>
      <span>♡</span><p>Building a life we love,<br />together.</p><div className={styles.sprig} />
    </div>
  </aside>;
}
