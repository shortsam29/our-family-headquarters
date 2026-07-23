import { Card } from "@/components/design-system";
import styles from "./TodayToDoCard.module.css";

const taskGroups = [
  { label: "Make bed", time: "Morning" },
  { label: "Feed the dog", time: "Morning" },
  { label: "Unload dishwasher", time: "Afternoon" },
  { label: "Take out trash", time: "Afternoon" },
  { label: "Homework / Study time", time: "Evening" },
  { label: "15 minutes of reading", time: "Evening" },
];

export default function TodayToDoCard() {
  return (
    <section id="my-day" aria-labelledby="today-todo-heading">
      <Card className={styles.toDoCard} variant="sage">
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Your tasks. Your day. You’ve got this!</p>
            <h2 id="today-todo-heading" className={styles.title}>Today’s To-Do List</h2>
          </div>
          <span className={styles.status} aria-hidden="true">✓</span>
        </div>

        <ul className={styles.taskList} aria-label="Future task categories">
          {taskGroups.map((task) => (
            <li key={task.label}>
              <span className={styles.checkmark} aria-hidden="true" />
              <span>{task.label}</span>
              <small>{task.time}</small>
            </li>
          ))}
        </ul>

        <p className={styles.supportingNote}>
          One step at a time.
        </p>
      </Card>
    </section>
  );
}
