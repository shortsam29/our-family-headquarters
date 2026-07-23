import type { HTMLAttributes, ReactNode } from "react";
import styles from "./DesignSystem.module.css";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  artwork?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, artwork, action, className = "", ...props }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${className}`.trim()} {...props}>
      {artwork ? <div className={styles.emptyArtwork}>{artwork}</div> : null}
      <h3 className="type-card-heading">{title}</h3>
      <p className="type-supporting">{description}</p>
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}
