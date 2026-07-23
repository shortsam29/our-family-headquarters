import { Card } from "@/components/design-system";
import type { SectionState } from "@/types/today";
import TodaySectionState from "./TodaySectionState";
import styles from "./TodayStatePreview.module.css";

const examples: Array<{ label: string; state: SectionState<string> }> = [
  { label: "Populated", state: { status: "populated", data: "Today’s information is ready." } },
  { label: "Empty", state: { status: "empty" } },
  { label: "Loading", state: { status: "loading" } },
  { label: "Error", state: { status: "error", message: "This example is temporarily unavailable." } },
];

export default function TodayStatePreview() {
  return (
    <div className={styles.grid}>
      {examples.map(({ label, state }) => (
        <Card key={label}>
          <p className="type-label">{label}</p>
          <TodaySectionState
            state={state}
            emptyTitle="Nothing waiting"
            emptyMessage="This calm state confirms there is nothing to review."
            loadingLabel="Getting today ready"
            errorMessage="This section is temporarily unavailable."
          >
            {(message) => <p className="type-supporting">{message}</p>}
          </TodaySectionState>
        </Card>
      ))}
    </div>
  );
}
