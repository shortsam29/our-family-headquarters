import type { HTMLAttributes, ReactNode } from "react";
import styles from "./DesignSystem.module.css";

type BadgeVariant = "neutral" | "sage" | "rose" | "blue" | "success" | "warning" | "error";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[`badge-${variant}`]} ${className}`.trim()} {...props} />;
}

type FamilyMemberBadgeProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  initials: string;
  detail?: ReactNode;
  tone?: "sage" | "rose" | "blue" | "taupe";
};

export function FamilyMemberBadge({ name, initials, detail, tone = "sage", className = "", ...props }: FamilyMemberBadgeProps) {
  return (
    <div className={`${styles.memberBadge} ${className}`.trim()} {...props}>
      <span aria-hidden="true" className={`${styles.avatar} ${styles[`avatar-${tone}`]}`}>
        {initials}
      </span>
      <span className={styles.memberText}>
        <strong>{name}</strong>
        {detail ? <small>{detail}</small> : null}
      </span>
    </div>
  );
}
