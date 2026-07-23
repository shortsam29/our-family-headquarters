import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./DesignSystem.module.css";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

export function Button({ className = "", variant = "primary", icon, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[`button-${variant}`]} ${className}`.trim()}
      type={type}
      {...props}
    >
      {icon ? <span className={styles.buttonIcon}>{icon}</span> : null}
      {children}
    </button>
  );
}
