import type { HTMLAttributes, ReactNode } from "react";
import styles from "./DesignSystem.module.css";

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action, className = "", ...props }: PageHeaderProps) {
  return (
    <header className={`${styles.pageHeader} ${className}`.trim()} {...props}>
      <div className={styles.headingCopy}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h1 className="type-page-heading">{title}</h1>
        {description ? <p className="type-supporting">{description}</p> : null}
      </div>
      {action ? <div className={styles.headingAction}>{action}</div> : null}
    </header>
  );
}

type SectionHeaderProps = HTMLAttributes<HTMLElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action, className = "", ...props }: SectionHeaderProps) {
  return (
    <header className={`${styles.sectionHeader} ${className}`.trim()} {...props}>
      <div>
        <h2 className="type-section-heading">{title}</h2>
        {description ? <p className="type-supporting">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
