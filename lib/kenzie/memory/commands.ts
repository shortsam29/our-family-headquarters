export type MemoryCommand =
  | { kind: "list" }
  | { kind: "forget_one"; search: string }
  | { kind: "forget_all" }
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "skip_message" }
  | { kind: "pause_conversation" };

export function detectMemoryCommand(message: string): MemoryCommand | null {
  const text = message.trim().replace(/[.!?]+$/, "");
  if (/^(?:what|which)\s+do you remember about me$/i.test(text) || /^show me (?:my )?memories$/i.test(text)) return { kind: "list" };
  if (/^(?:forget|delete) everything(?: about me| you remember about me)?$/i.test(text)) return { kind: "forget_all" };
  if (/^(?:stop|pause) remembering things$/i.test(text)) return { kind: "pause" };
  if (/^(?:start|resume) remembering things(?: again)?$/i.test(text)) return { kind: "resume" };
  if (/^(?:don'?t|do not) remember this(?: message)?$/i.test(text)) return { kind: "skip_message" };
  if (/^(?:don'?t|do not) save anything from this conversation$/i.test(text)) return { kind: "pause_conversation" };
  const forget = text.match(/^forget (?:that |my )?(.+)$/i);
  return forget ? { kind: "forget_one", search: forget[1].trim() } : null;
}
