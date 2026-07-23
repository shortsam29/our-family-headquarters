import styles from "./Sidebar.module.css";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Planning", href: "#planning" },
  { label: "Household", href: "#household" },
  { label: "Family", href: "#family" },
  { label: "Finance", href: "#finance" },
  { label: "Documents", href: "#documents" },
  { label: "Settings", href: "#settings" },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Primary navigation">
        <ul className={styles.navigationList}>
          {navigationItems.map((item) => (
            <li key={item.label}>
              <a
                className={styles.navigationLink}
                href={item.href}
                aria-current={item.label === "Dashboard" ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
