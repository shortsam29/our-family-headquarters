import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./DesignSystem.module.css";

type FieldDetails = {
  id: string;
  label: string;
  supportingText?: string;
  error?: string;
};

function FieldMessage({ id, supportingText, error }: Pick<FieldDetails, "id" | "supportingText" | "error">) {
  const message = error ?? supportingText;
  return message ? (
    <span className={`${styles.fieldMessage} ${error ? styles.fieldError : ""}`} id={`${id}-message`}>
      {message}
    </span>
  ) : null;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldDetails;

export function Input({ id, label, supportingText, error, className = "", ...props }: InputProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className="type-label">{label}</span>
      <input
        aria-describedby={supportingText || error ? `${id}-message` : undefined}
        aria-invalid={Boolean(error)}
        className={`${styles.control} ${className}`.trim()}
        id={id}
        {...props}
      />
      <FieldMessage id={id} supportingText={supportingText} error={error} />
    </label>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldDetails;

export function Textarea({ id, label, supportingText, error, className = "", ...props }: TextareaProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className="type-label">{label}</span>
      <textarea
        aria-describedby={supportingText || error ? `${id}-message` : undefined}
        aria-invalid={Boolean(error)}
        className={`${styles.control} ${styles.textarea} ${className}`.trim()}
        id={id}
        {...props}
      />
      <FieldMessage id={id} supportingText={supportingText} error={error} />
    </label>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldDetails;

export function Select({ id, label, supportingText, error, className = "", children, ...props }: SelectProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className="type-label">{label}</span>
      <select
        aria-describedby={supportingText || error ? `${id}-message` : undefined}
        aria-invalid={Boolean(error)}
        className={`${styles.control} ${styles.select} ${className}`.trim()}
        id={id}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={id} supportingText={supportingText} error={error} />
    </label>
  );
}
