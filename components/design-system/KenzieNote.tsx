import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "./Card";
import styles from "./DesignSystem.module.css";

type KenzieNoteProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  message: ReactNode;
  graphic?: ReactNode;
  signature?: ReactNode;
  audience?: "neutral" | "family" | "adult" | "child";
};

export function KenzieNote({
  title,
  message,
  graphic,
  signature = "❤️ Kenzie",
  audience = "neutral",
  className = "",
  ...props
}: KenzieNoteProps) {
  return (
    <Card className={`${styles.kenzieNote} ${styles[`kenzie-${audience}`]} ${className}`.trim()} variant="kenzie" {...props}>
      {graphic ? <div className={styles.kenzieGraphic}>{graphic}</div> : null}
      <div className={styles.kenzieContent}>
        {title ? <h3 className="type-card-heading">{title}</h3> : null}
        <div className={styles.kenzieMessage}>{message}</div>
        <div className={styles.kenzieSignature}>{signature}</div>
      </div>
    </Card>
  );
}
