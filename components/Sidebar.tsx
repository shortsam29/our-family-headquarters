"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const baseItems = [
  { label: "My Headquarters", href: "/my-headquarters", icon: "person" },
  { label: "Schedule", href: "/schedule", icon: "calendar" },
  { label: "Shopping", href: "/shopping", icon: "more" },
  { label: "Family Hub", href: "/family-hub", icon: "family" },
  { label: "Kenzie", href: "/kenzie", icon: "heart" },
  { label: "Settings", href: "/settings", icon: "more" },
];
function Icon({name}:{name:string}){const p={width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};if(name==="home")return <svg {...p}><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></svg>;if(name==="calendar")return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>;if(name==="family")return <svg {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.6-.5 5.7 1.2 6.3 4.5"/></svg>;if(name==="person")return <svg {...p}><circle cx="12" cy="7" r="4"/><path d="M4.5 21c.5-5.2 3-7.8 7.5-7.8s7 2.6 7.5 7.8z"/></svg>;if(name==="heart")return <svg {...p}><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/></svg>;return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>}
export default function Sidebar({showMomsPlanner=false}:{showMomsPlanner?:boolean}){const path=usePathname();const items=showMomsPlanner?[...baseItems.slice(0,5),{label:"Mom's Planner",href:"/moms-planner",icon:"heart"},baseItems[5]]:baseItems;return <aside className={styles.sidebar}><nav aria-label="Primary navigation"><Link href="/" className={styles.homeLink} aria-current={path==="/"?"page":undefined}><Icon name="home"/><span><strong>Our Family Headquarters</strong><small>Everything your family needs today.</small></span></Link><ul className={styles.navigationList}>{items.map(item=>{const current=path===item.href||(item.href==="/family-hub"&&path.startsWith("/family-hub/"));return <li key={item.href}><Link href={item.href} className={styles.navigationLink} aria-current={current?"page":undefined}><Icon name={item.icon}/><strong>{item.label}</strong></Link></li>})}</ul></nav><div className={styles.sidebarWelcome} aria-hidden="true"><span>♡</span><p>Building a life we love,<br/>together.</p></div></aside>}
