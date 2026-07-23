import styles from "./Sidebar.module.css";

const navigationItems = [
  {
    label: "Today’s Headquarters",
    subtitle: "Everything your family needs today.",
    href: "/",
    icon: "home",
    isCurrent: true,
  },
  { label: "Schedule", href: "#schedule", icon: "calendar" },
  { label: "Family Hub", href: "#family-hub", icon: "family" },
  { label: "My Day", href: "#my-day", icon: "person" },
  { label: "More", href: "#more", icon: "more" },
];

function NavigationIcon({ name }: { name: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") return <svg {...common}><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
  if (name === "family") return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.6-.5 5.7 1.2 6.3 4.5" /></svg>;
  if (name === "person") return <svg {...common}><circle cx="12" cy="7" r="4" /><path d="M4.5 21c.5-5.2 3-7.8 7.5-7.8s7 2.6 7.5 7.8z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
}

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Primary navigation">
        <ul className={styles.navigationList}>
          {navigationItems.map((item) => (
            <li key={item.label}>
              <a className={styles.navigationLink} href={item.href} aria-current={item.isCurrent ? "page" : undefined}>
                <NavigationIcon name={item.icon} />
                <span className={styles.navigationCopy}>
                  <strong>{item.label}</strong>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarWelcome} aria-hidden="true">
        <div className={styles.plant}><i /><i /><i /><i /><i /></div>
        <span>♡</span>
        <p>Building a life we love,<br />together.</p>
        <div className={styles.sprig} />
      </div>
    </aside>
  );
}
