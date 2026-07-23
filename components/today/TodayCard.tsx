import type { HTMLAttributes, ReactNode } from "react";
import { Card, type CardVariant } from "@/components/design-system";
import styles from "./TodayCard.module.css";

type TodayCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  detail?: ReactNode;
  variant?: CardVariant;
};

export default function TodayCard({
  title,
  eyebrow,
  detail,
  variant = "default",
  className = "",
  children,
  ...props
}: TodayCardProps) {
  return (
    <Card className={`${styles.card} ${className}`.trim()} variant={variant} {...props}>
      <div className={styles.heading}>
        <div>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 className="type-card-heading">{title}</h2>
        </div>
        {detail ? <div className={styles.detail}>{detail}</div> : null}
      </div>
      <div className={styles.content}>{children}</div>
    </Card>
  );
}
