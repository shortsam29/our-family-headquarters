"use client";

import { FormEvent, useState } from "react";
import styles from "./KenzieDevelopmentChat.module.css";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Proposal =
  | { kind: "create_calendar_event"; title: string; date: string; time: string }
  | { kind: "save_meal"; name: string; mealType: "breakfast" | "lunch" | "dinner" | "snack"; date: string };
type ChatResponse = { ok: boolean; message: string; status?: "proposal" | "completed"; proposal?: Proposal };

export function KenzieDevelopmentChat({ memberName }: { memberName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null);

  async function post(body: Record<string, unknown>) {
    setError(null);
    setSending(true);
    try {
      const response = await fetch("/api/kenzie/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as ChatResponse;
      if (!response.ok || !result.ok) {
        setError(result.message || "Kenzie could not answer right now.");
        return;
      }
      setMessages((current) => [...current, { role: "assistant", content: result.message }]);
      setPendingProposal(result.status === "proposal" && result.proposal ? result.proposal : null);
    } catch {
      setError("Kenzie could not answer right now. Your message was not saved.");
    } finally {
      setSending(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    const history = messages.slice(-12);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setDraft("");
    setPendingProposal(null);
    await post({ message, history });
  }

  async function confirmProposal() {
    if (!pendingProposal || sending) return;
    const proposal = pendingProposal;
    setPendingProposal(null);
    await post({
      message: "Confirm the proposed household action.",
      history: messages.slice(-12),
      confirmedAction: proposal,
    });
  }

  return (
    <div className={styles.chat}>
      <p className="type-supporting">
        Kenzie can answer general questions, use relevant household information, and perform a small set of authorized household actions. This conversation lasts only in this page session.
      </p>
      <div className={styles.messages} aria-live="polite" aria-label="Kenzie conversation">
        {messages.length ? messages.map((item, index) => (
          <div className={item.role === "assistant" ? styles.kenzie : styles.person} key={`${item.role}-${index}`}>
            <strong>{item.role === "assistant" ? "Kenzie" : memberName}</strong>
            <p>{item.content}</p>
          </div>
        )) : <p className={styles.empty}>Ask a question, check on the household, or request help with something you are authorized to change.</p>}
        {sending ? <p role="status">Kenzie is thinking…</p> : null}
      </div>
      {pendingProposal ? (
        <div className={styles.confirmation} role="group" aria-label="Confirm Kenzie action">
          <p>Review Kenzie&apos;s proposed change before it is saved.</p>
          <button type="button" className="button button--primary" onClick={confirmProposal} disabled={sending}>Confirm</button>
          <button type="button" onClick={() => setPendingProposal(null)} disabled={sending}>Cancel</button>
        </div>
      ) : null}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <form onSubmit={send} className={styles.form}>
        <label htmlFor="kenzie-message">Message Kenzie</label>
        <textarea id="kenzie-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={4} disabled={sending} required />
        <div className={styles.actions}>
          <button type="submit" className="button button--primary" disabled={sending || !draft.trim()}>Send message</button>
          <button
            type="button"
            onClick={() => { setMessages([]); setDraft(""); setError(null); setPendingProposal(null); }}
            disabled={sending || (!messages.length && !draft)}
          >
            Reset conversation
          </button>
        </div>
      </form>
    </div>
  );
}
