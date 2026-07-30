"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./KenzieDevelopmentChat.module.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tone?: "success" | "error";
  memoryNotice?: { id: string; displayText: string };
};
type Proposal =
  | { kind: "create_calendar_event"; title: string; date: string; time: string }
  | { kind: "save_meal"; name: string; mealType: "breakfast" | "lunch" | "dinner" | "snack"; date: string }
  | { kind: "create_note"; recipientSearch: string; recipientLabel: string; title: string; message: string }
  | { kind: "create_reminder"; recipientSearch: string; recipientLabel: string; message: string; date: string; time: string; recurrence?: "daily" | "weekly" | "monthly" | "yearly" }
  | { kind: "delete_all_memories" };
type ChatResponse = {
  ok: boolean;
  message: string;
  status?: "proposal" | "clarification" | "completed";
  proposal?: Proposal;
  conversationMemoryPaused?: boolean;
  memoryNotice?: { id: string; displayText: string };
};

const suggestions = [
  "What chores do I have?",
  "What is on our calendar tomorrow?",
  "Help me understand fractions",
  "What meals are planned this week?",
];

function ProposalDetails({ proposal }: { proposal: Proposal }) {
  if (proposal.kind === "delete_all_memories") {
    return <dl><div><dt>Action</dt><dd>Delete all personal memories</dd></div><div><dt>Effect</dt><dd>All active memories will be removed. Automatic memory will remain on unless you pause it separately.</dd></div></dl>;
  }
  if (proposal.kind === "create_calendar_event") {
    return <dl><div><dt>Action</dt><dd>Create calendar event</dd></div><div><dt>Title</dt><dd>{proposal.title}</dd></div><div><dt>Date</dt><dd>{proposal.date}</dd></div><div><dt>Time</dt><dd>{proposal.time}</dd></div></dl>;
  }
  if (proposal.kind === "save_meal") {
    return <dl><div><dt>Action</dt><dd>Update meal plan</dd></div><div><dt>Meal</dt><dd>{proposal.name}</dd></div><div><dt>Day</dt><dd>{proposal.date}</dd></div><div><dt>Type</dt><dd>{proposal.mealType}</dd></div></dl>;
  }
  if (proposal.kind === "create_note") {
    return <dl><div><dt>Action</dt><dd>Leave a private note</dd></div><div><dt>For</dt><dd>{proposal.recipientLabel}</dd></div><div><dt>Message</dt><dd>{proposal.message}</dd></div></dl>;
  }
  return <dl><div><dt>Action</dt><dd>Set {proposal.recurrence ? `a ${proposal.recurrence}` : "a one-time"} reminder</dd></div><div><dt>For</dt><dd>{proposal.recipientLabel}</dd></div><div><dt>Reminder</dt><dd>{proposal.message}</dd></div><div><dt>{proposal.recurrence ? "Starts" : "When"}</dt><dd>{proposal.date} at {proposal.time}</dd></div>{proposal.recurrence ? <div><dt>Repeats</dt><dd>{proposal.recurrence}</dd></div> : null}</dl>;
}

function proposalDraft(proposal: Proposal) {
  if (proposal.kind === "delete_all_memories") return "Forget everything about me";
  if (proposal.kind === "create_calendar_event") return `Schedule ${proposal.title} on ${proposal.date} at ${proposal.time}`;
  if (proposal.kind === "save_meal") return `Plan ${proposal.mealType} ${proposal.name} for ${proposal.date}`;
  if (proposal.kind === "create_note") return `Leave ${proposal.recipientLabel} a note saying ${proposal.message}`;
  if (proposal.recurrence) {
    const period = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[proposal.recurrence];
    return `Remind ${proposal.recipientLabel} every ${period} at ${proposal.time} to ${proposal.message}`;
  }
  return `Remind ${proposal.recipientLabel} ${proposal.date} at ${proposal.time} to ${proposal.message}`;
}

export function KenzieDevelopmentChat({ memberName, memoryEnabled = false }: { memberName: string; memoryEnabled?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null);
  const [lastRequest, setLastRequest] = useState<Record<string, unknown> | null>(null);
  const [preventMemory, setPreventMemory] = useState(false);
  const [conversationMemoryDisabled, setConversationMemoryDisabled] = useState(false);
  const conversationId = useRef<string>(crypto.randomUUID());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending, pendingProposal]);

  async function post(body: Record<string, unknown>) {
    if (sending) return null;
    setError(null);
    setLastRequest(body);
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
        return null;
      }
      setMessages((current) => [...current, {
        role: "assistant",
        content: result.message,
        tone: result.status === "completed" ? "success" : undefined,
        memoryNotice: result.memoryNotice,
      }]);
      setPendingProposal(result.status === "proposal" && result.proposal ? result.proposal : null);
      if (result.conversationMemoryPaused) setConversationMemoryDisabled(true);
      setLastRequest(null);
      return result;
    } catch {
      setError("Kenzie could not answer right now. Your message was not saved.");
      return null;
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(message: string) {
    const value = message.trim();
    if (!value || sending) return;
    const history = messages.slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: value }]);
    setDraft("");
    setPendingProposal(null);
    const messageId = crypto.randomUUID();
    const result = await post({
      message: value,
      history,
      conversationId: conversationId.current,
      messageId,
      preventMemory,
      conversationMemoryDisabled,
    });
    if (result?.ok && memoryEnabled && !preventMemory && !conversationMemoryDisabled) {
      void extractMemory(value, messageId);
    }
    setPreventMemory(false);
  }

  async function extractMemory(message: string, messageId: string) {
    try {
      const response = await fetch("/api/kenzie/memory/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: conversationId.current,
          messageId,
        }),
      });
      if (!response.ok) return;
      const result = (await response.json()) as Pick<ChatResponse, "memoryNotice">;
      if (!result.memoryNotice) return;
      setMessages((current) => {
        const next = [...current];
        for (let index = next.length - 1; index >= 0; index -= 1) {
          if (next[index].role === "assistant") {
            next[index] = { ...next[index], memoryNotice: result.memoryNotice };
            break;
          }
        }
        return next;
      });
    } catch {
      // Memory is optional and must never interrupt the main conversation.
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function confirmProposal() {
    if (!pendingProposal || sending) return;
    const proposal = pendingProposal;
    setPendingProposal(null);
    await post({
      message: "Confirm the proposed household action.",
      history: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      ...(proposal.kind === "delete_all_memories"
        ? { confirmedMemoryAction: proposal }
        : { confirmedAction: proposal }),
    });
  }

  async function undoMemory(id: string) {
    await post({
      message: "Undo that saved memory.",
      history: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      undoMemoryId: id,
    });
  }

  return (
    <div className={styles.chat}>
      <div className={styles.welcome}>
        <strong>Hi {memberName}! What can I help with?</strong>
        <p>I can help with your household, homework, writing, ideas, explanations, and everyday questions. Full conversations are never stored.</p>
        <p className={styles.memoryStatus}>Automatic memory: <strong>{memoryEnabled && !conversationMemoryDisabled ? "On" : "Paused"}</strong> · <Link href="/settings#kenzie-memory">View and control memories</Link></p>
      </div>
      {!messages.length ? (
        <div className={styles.suggestions} aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)} disabled={sending}>{suggestion}</button>
          ))}
        </div>
      ) : null}
      <div className={styles.messages} aria-live="polite" aria-label="Kenzie conversation">
        {messages.length ? messages.map((item, index) => (
          <div
            className={`${item.role === "assistant" ? styles.kenzie : styles.person} ${item.tone === "success" ? styles.success : ""}`}
            key={`${item.role}-${index}`}
          >
            <strong>{item.role === "assistant" ? "Kenzie" : memberName}</strong>
            <p>{item.content}</p>
            {item.memoryNotice ? (
              <div className={styles.memoryNotice}>
                <span>Remembered: {item.memoryNotice.displayText}</span>
                <button type="button" onClick={() => undoMemory(item.memoryNotice!.id)} disabled={sending}>
                  Undo
                </button>
                <Link href="/settings#kenzie-memory">Review</Link>
              </div>
            ) : null}
          </div>
        )) : <p className={styles.empty}>Choose an idea above or ask anything in your own words.</p>}
        {sending ? <p className={styles.thinking} role="status">Kenzie is thinking…</p> : null}
        <div ref={endRef} />
      </div>
      {pendingProposal ? (
        <div className={styles.confirmation} role="group" aria-label="Confirm Kenzie action">
          <div className={styles.previewHeading}><span>Action preview</span><strong>Please review before saving</strong></div>
          <ProposalDetails proposal={pendingProposal} />
          <p className={styles.previewNotice}>Nothing changes until you confirm. Kenzie will use your signed-in household permissions.</p>
          <div className={styles.actions}>
            <button type="button" className="button button--primary" onClick={confirmProposal} disabled={sending}>Confirm and save</button>
            <button type="button" onClick={() => { setDraft(proposalDraft(pendingProposal)); setPendingProposal(null); }} disabled={sending}>Edit request</button>
            <button type="button" onClick={() => setPendingProposal(null)} disabled={sending}>Don&apos;t save</button>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          {lastRequest ? <button type="button" onClick={() => post(lastRequest)} disabled={sending}>Try again</button> : null}
        </div>
      ) : null}
      <form onSubmit={send} className={styles.form}>
        <label htmlFor="kenzie-message">Message Kenzie</label>
        <textarea
          id="kenzie-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={4000}
          rows={4}
          disabled={sending}
          required
          placeholder="Ask a question or request household help…"
        />
        <p className={styles.hint}>Press Enter to send. Use Shift+Enter for a new line.</p>
        {memoryEnabled && !conversationMemoryDisabled ? (
          <label className={styles.memoryOptOut}>
            <input type="checkbox" checked={preventMemory} onChange={(event) => setPreventMemory(event.target.checked)} />
            Don&apos;t remember this message
          </label>
        ) : null}
        <div className={styles.actions}>
          <button type="submit" className="button button--primary" disabled={sending || !draft.trim()}>
            {sending ? "Sending…" : "Send message"}
          </button>
          <button
            type="button"
            onClick={() => { setMessages([]); setDraft(""); setError(null); setPendingProposal(null); setLastRequest(null); setPreventMemory(false); setConversationMemoryDisabled(false); conversationId.current = crypto.randomUUID(); }}
            disabled={sending || (!messages.length && !draft)}
          >
            Start over
          </button>
        </div>
      </form>
    </div>
  );
}
