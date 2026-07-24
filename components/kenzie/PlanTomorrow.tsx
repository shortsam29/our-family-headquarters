"use client";

import { useActionState, useState } from "react";
import { approveTomorrowPlan, type PlanApprovalState } from "@/app/actions/kenzie";
import styles from "./PlanTomorrow.module.css";

const prompts = [
  ["Appointments", "Appointments or places to be"],
  ["Chores & tasks", "Chores, tasks, homework, or routines"],
  ["Dinner", "Dinner plan"],
  ["Shopping", "Shopping or groceries"],
  ["Travel", "Travel or packing"],
  ["Celebrations", "Birthdays or celebrations"],
  ["Bills", "Bills or obligations"],
  ["Care", "Pets, vehicles, or household care"],
  ["Family note", "Anything the family should remember"],
] as const;
type ProposalItem = { category: string; title: string };
const initialState: PlanApprovalState = { ok: false, message: "" };

export function PlanTomorrow() {
  const [proposal, setProposal] = useState<ProposalItem[] | null>(null);
  const [state, action, pending] = useActionState(approveTomorrowPlan, initialState);
  function prepare(formData: FormData) {
    const items = prompts.map(([category]) => ({ category, title: String(formData.get(category) ?? "").trim() })).filter((item) => item.title);
    setProposal(items);
  }
  if (state.ok) return <p className={styles.success} role="status">{state.message}</p>;
  return <div className={styles.planner}>
    {!proposal ? <form action={prepare} className={styles.guide}>{prompts.map(([category, label]) => <label key={category}>{label}<input name={category} maxLength={300} /></label>)}<button type="submit">Prepare Tomorrow Plan</button></form> : <div>
      <p className={styles.notice}>This is a proposal only. Nothing is saved until you approve it.</p>
      {proposal.length === 0 ? <p role="alert">Add at least one item so Kenzie has something to prepare.</p> : <ul className={styles.proposal}>{proposal.map((item, index) => <li key={`${item.category}-${index}`}><label>{item.category}<input value={item.title} onChange={(event) => setProposal((current) => current?.map((entry, entryIndex) => entryIndex === index ? { ...entry, title: event.target.value } : entry) ?? [])} /></label><button type="button" onClick={() => setProposal((current) => current?.filter((_, entryIndex) => entryIndex !== index) ?? [])}>Remove item</button></li>)}</ul>}
      <form action={action}><input type="hidden" name="items" value={JSON.stringify(proposal)} />{state.message ? <p role="alert">{state.message}</p> : null}<button type="submit" disabled={pending || proposal.length === 0}>{pending ? "Saving approved plan…" : "Approve and Save"}</button></form>
      <div className={styles.secondary}><button type="button" onClick={() => setProposal(null)}>Edit Proposal</button><button type="button" onClick={() => { setProposal(null); }}>Cancel</button></div>
    </div>}
  </div>;
}
