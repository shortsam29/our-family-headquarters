import { memoryExtractionSchema, type MemoryCandidate } from "./types";
import { containsProhibitedMemoryContent, validateMemoryCandidate } from "./safety";

function sentence(value: string) {
  return value.trim().replace(/[.!?]+$/, "").replace(/\s+/g, " ");
}

function candidate(
  category: MemoryCandidate["category"],
  subject: string,
  value: string,
  displayText: string,
  durability: MemoryCandidate["durability"] = "durable",
  expirationDays?: number,
): MemoryCandidate {
  return {
    category,
    subject,
    normalizedValue: value.toLowerCase(),
    displayText,
    durability,
    confidence: "high",
    sensitivity: "low",
    expirationDays,
  };
}

export function extractDirectMemoryCandidates(message: string, role: string): MemoryCandidate[] {
  const text = sentence(message);
  if (!text || containsProhibitedMemoryContent(text)) return [];
  const found: MemoryCandidate[] = [];

  let match = text.match(/^i\s+(?:really\s+)?(hate|dislike|love|like|prefer)\s+(.+)$/i);
  if (match) {
    const verb = match[1].toLowerCase();
    const value = sentence(match[2]);
    if (verb === "hate" || verb === "dislike") found.push(candidate("dislike", value, "dislike", `You do not like ${value}.`));
    else if (verb === "prefer") found.push(candidate("preference", "general preference", value, `You prefer ${value}.`));
    else found.push(candidate("preference", value, "like", `You like ${value}.`));
  }

  match = text.match(/^my favorite\s+(.+?)\s+is\s+(.+)$/i);
  if (match) found.push(candidate("favorite", sentence(match[1]), sentence(match[2]), `Your favorite ${sentence(match[1])} is ${sentence(match[2])}.`));

  match = text.match(/^i\s+(?:learn|understand)\s+better\s+with\s+(.+)$/i);
  if (match) found.push(candidate("learning_preference", "explanation style", sentence(match[1]), `You learn better with ${sentence(match[1])}.`));

  match = text.match(/^i prefer\s+(short|brief|detailed|step-by-step)\s+(?:answers|explanations|responses)$/i);
  if (match) found.push(candidate("communication_preference", "response style", match[1], `You prefer ${match[1]} responses.`));

  match = text.match(/^i prefer reminders\s+(.+)$/i);
  if (match) found.push(candidate("reminder_preference", "reminder timing", sentence(match[1]), `You prefer reminders ${sentence(match[1])}.`));

  match = text.match(/^(?:please\s+)?call me\s+([A-Za-z][A-Za-z .'-]{0,40})$/i);
  if (match) found.push(candidate("communication_preference", "preferred name", sentence(match[1]), `You prefer to be called ${sentence(match[1])}.`));

  match = text.match(/^i usually\s+(.+)$/i);
  if (match) found.push(candidate("routine", "usual routine", sentence(match[1]), `You usually ${sentence(match[1])}.`));

  match = text.match(/^i am (?:working on|studying for|preparing for)\s+(.+)$/i);
  if (match) found.push(candidate("temporary_context", "current project", sentence(match[1]), `You are currently working on ${sentence(match[1])}.`, "temporary", 45));

  match = text.match(/^actually,?\s+(.+?)\s+(?:are|is)\s+(?:fine|okay|ok|good)$/i);
  if (match) {
    const subject = sentence(match[1]);
    found.push(candidate("dislike", subject, "no longer disliked", `You no longer dislike ${subject}.`));
  }

  return memoryExtractionSchema.parse({ candidates: found.slice(0, 3) }).candidates
    .map((item) => validateMemoryCandidate(item, role))
    .filter((item): item is MemoryCandidate => Boolean(item));
}
