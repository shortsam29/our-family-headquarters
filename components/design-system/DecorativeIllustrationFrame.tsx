import type { HTMLAttributes, ReactNode } from "react";
import styles from "./DesignSystem.module.css";

type DecorativeProps = {
  decorative: true;
  ariaLabel?: never;
};

type InformativeProps = {
  decorative?: false;
  ariaLabel: string;
};

type IllustrationFrameProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-label"> &
  (DecorativeProps | InformativeProps) & {
    children: ReactNode;
    cornerGraphic?: ReactNode;
    variant?: "default" | "empty" | "kenzie";
  };

export function DecorativeIllustrationFrame({
  decorative = false,
  ariaLabel,
  children,
  cornerGraphic,
  variant = "default",
  className = "",
  ...props
}: IllustrationFrameProps) {
  return (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      className={`${styles.illustrationFrame} ${styles[`illustration-${variant}`]} ${className}`.trim()}
      role={decorative ? undefined : "img"}
      {...props}
    >
      {cornerGraphic ? <div className={styles.cornerGraphic}>{cornerGraphic}</div> : null}
      <div className={styles.illustrationContent}>{children}</div>
    </div>
  );
}
