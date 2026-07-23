import type { HTMLAttributes, ReactNode } from "react";
import styles from "./DesignSystem.module.css";

export type CardVariant = "default" | "sage" | "blush" | "neutral" | "kenzie";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className = "", variant = "default", ...props }: CardProps) {
  return <div className={`${styles.card} ${styles[`card-${variant}`]} ${className}`.trim()} {...props} />;
}

type SectionCardProps = CardProps & {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionCard({ title, description, action, children, ...props }: SectionCardProps) {
  return (
    <Card {...props}>
      <div className={styles.sectionCardHeader}>
        <div>
          <h3 className="type-card-heading">{title}</h3>
          {description ? <p className="type-supporting">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </Card>
  );
}
