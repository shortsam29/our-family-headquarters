"use client";

import { useState } from "react";
import { Card } from "@/components/design-system";
import type { SectionState, TodayTask } from "@/types/today";
import TodaySectionState from "./TodaySectionState";
import styles from "./TodayToDoCard.module.css";

type TodayToDoCardProps = {
  state: SectionState<TodayTask[]>;
};

export default function TodayToDoCard({ state }: TodayToDoCardProps) {
  const [tasks, setTasks] = useState(state.status === "populated" ? state.data : []);

  const displayState: SectionState<TodayTask[]> =
    state.status === "populated" ? { status: "populated", data: tasks } : state;

  const toggleTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    );
  };

  return (
    <section id="my-day" aria-labelledby="today-todo-heading">
      <Card className={styles.toDoCard} variant="sage">
        <TodaySectionState
          state={displayState}
          emptyTitle="You’re all caught up"
          emptyMessage="There’s nothing left on your list today. Enjoy the breathing room."
          loadingLabel="Preparing your list"
          errorMessage="Your tasks couldn’t be loaded. Nothing has been changed."
        >
          {(currentTasks) => {
            const completedCount = currentTasks.filter((task) => task.completed).length;
            const allComplete = completedCount === currentTasks.length;

            return (
              <>
                <div className={styles.heading}>
                  <div>
                    <p className={styles.eyebrow}>Your tasks. Your day. You’ve got this!</p>
                    <h2 id="today-todo-heading" className={styles.title}>Today’s To-Do List</h2>
                  </div>
                  <span className={styles.status} role="status" aria-live="polite">
                    {allComplete ? "All complete" : `${completedCount} of ${currentTasks.length} complete`}
                  </span>
                </div>

                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-label="Today’s task progress"
                  aria-valuemin={0}
                  aria-valuemax={currentTasks.length}
                  aria-valuenow={completedCount}
                >
                  <span style={{ width: `${(completedCount / currentTasks.length) * 100}%` }} />
                </div>

                <ul className={styles.taskList}>
                  {currentTasks.map((task) => (
                    <li key={task.id} className={task.completed ? styles.completed : undefined}>
                      <button
                        type="button"
                        className={styles.taskToggle}
                        aria-pressed={task.completed}
                        aria-label={`${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
                        onClick={() => toggleTask(task.id)}
                      >
                        <span className={styles.checkmark} aria-hidden="true">{task.completed ? "✓" : ""}</span>
                        <span className={styles.taskCopy}>
                          <span className={styles.taskTitle}>{task.title}</span>
                          {task.category ? <span className={styles.category}>{task.category}</span> : null}
                        </span>
                        {task.dueTime || task.daypart ? <small>{task.dueTime ?? task.daypart}</small> : null}
                        <span className={styles.stateLabel}>{task.completed ? "Completed" : "Not completed"}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <p className={styles.supportingNote}>
                  {allComplete ? "Today’s complete." : "One step at a time."}
                </p>
              </>
            );
          }}
        </TodaySectionState>
      </Card>
    </section>
  );
}
