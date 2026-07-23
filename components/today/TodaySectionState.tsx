import type { ReactNode } from "react";
import type { SectionState } from "@/types/today";
import styles from "./TodaySectionState.module.css";

type TodaySectionStateProps<T> = {
  state: SectionState<T>;
  emptyTitle: string;
  emptyMessage: string;
  loadingLabel: string;
  errorMessage: string;
  children: (data: T) => ReactNode;
};

export default function TodaySectionState<T>({
  state,
  emptyTitle,
  emptyMessage,
  loadingLabel,
  errorMessage,
  children,
}: TodaySectionStateProps<T>) {
  if (state.status === "populated") {
    return children(state.data);
  }

  if (state.status === "loading") {
    return (
      <div className={`${styles.state} ${styles.loading}`} role="status" aria-live="polite">
        <strong>{loadingLabel}</strong>
        <p>Getting this part of today ready.</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={`${styles.state} ${styles.error}`} role="status">
        <strong>Not available right now</strong>
        <p>{state.message ?? errorMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.state}>
      <strong>{emptyTitle}</strong>
      <p>{emptyMessage}</p>
    </div>
  );
}
