"use client";

import { useActionState, useEffect, useRef } from "react";
import { savePersonalTask, type PersonalTaskState } from "@/app/actions/personal-tasks";
import styles from "./PersonalTaskForm.module.css";

const initialState: PersonalTaskState = { ok: false, message: "" };

export function PersonalTaskForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(savePersonalTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      if (detailsRef.current) detailsRef.current.open = false;
    }
  }, [state]);

  return (
    <details ref={detailsRef} className={styles.addTask}>
      <summary>+ Add Your Own Task</summary>
      <form ref={formRef} action={action} className={styles.form}>
        <p className={styles.intro}>Add something you want to remember or complete. This task is assigned only to you.</p>
        <label>Task name<input name="title" required maxLength={160} /></label>
        <div className={styles.row}>
          <label>Due date<input name="dueDate" type="date" defaultValue={today} /></label>
          <label>Due time (optional)<input name="dueTime" type="time" /></label>
        </div>
        <div className={styles.row}>
          <label>Type<select name="category" defaultValue="personal"><option value="personal">Personal</option><option value="chore">Chore</option><option value="homework">Homework</option><option value="routine">Routine</option></select></label>
          <label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
        </div>
        <label>Notes (optional)<textarea name="description" maxLength={2000} /></label>
        <div className={styles.actions}><button disabled={pending}>{pending ? "Adding..." : "Add to My List"}</button></div>
        {state.message ? <p className={state.ok ? styles.success : styles.error} role={state.ok ? "status" : "alert"}>{state.message}</p> : null}
      </form>
    </details>
  );
}