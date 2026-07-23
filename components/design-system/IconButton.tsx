import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonVariant } from "./Button";
import styles from "./DesignSystem.module.css";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  "aria-label": string;
  children: ReactNode;
  variant?: ButtonVariant;
};

export function IconButton({ className = "", variant = "ghost", children, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      className={`${styles.iconButton} ${styles[`button-${variant}`]} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
