import type { MemoryCandidate } from "./types";

const prohibited = [
  /\b(password|passcode|pin|one[- ]time code|authentication code|api key|access token|secret key)\b/i,
  /\b(?:\d[ -]*?){13,19}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(social security|bank account|routing number|government id|driver'?s license|passport number)\b/i,
  /\b(diagnosed|diagnosis|my doctor|medical condition|medication|self[- ]harm|suicid|abuse|assault|sexual)\b/i,
  /\b\d{1,5}\s+[A-Za-z0-9.' -]+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b/i,
  /\b(ignore|override|disregard)\b.{0,60}\b(system|developer|instruction|policy|rules?)\b/i,
  /\b(system|developer|instruction|policy|rules?)\b.{0,60}\b(ignore|ignored|override|disregard)\b/i,
  /\b(select|insert|update|delete|drop|alter)\s+(from|into|table|database)\b/i,
  /\b(dad|mom|mother|father|brother|sister|parent|guardian)\b.{0,80}\b(lying|liar|annoying|hates?|abuses?|steals?|always|never)\b/i,
];

const instructionLike = /\b(run|execute|call|send|delete|change)\b.{0,50}\b(tool|sql|prompt|system|role|permission)\b/i;

export function containsProhibitedMemoryContent(value: string) {
  return prohibited.some((pattern) => pattern.test(value)) || instructionLike.test(value);
}

export function sanitizeMemoryText(value: string, maxLength: number) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function validateMemoryCandidate(candidate: MemoryCandidate, role: string) {
  const cleaned: MemoryCandidate = {
    ...candidate,
    subject: sanitizeMemoryText(candidate.subject.toLowerCase(), 120),
    normalizedValue: sanitizeMemoryText(candidate.normalizedValue.toLowerCase(), 240),
    displayText: sanitizeMemoryText(candidate.displayText, 500),
  };
  const combined = `${cleaned.subject} ${cleaned.normalizedValue} ${cleaned.displayText}`;
  if (!cleaned.subject || !cleaned.normalizedValue || !cleaned.displayText) return null;
  if (containsProhibitedMemoryContent(combined)) return null;
  if (cleaned.confidence !== "high" && cleaned.durability === "durable") return null;
  if (cleaned.sensitivity === "moderate") return null;
  if (role === "child" && ["relationship_context", "accessibility_preference"].includes(cleaned.category)) return null;
  if (cleaned.durability === "temporary") {
    cleaned.expirationDays = Math.min(90, Math.max(7, cleaned.expirationDays ?? 30));
  } else {
    delete cleaned.expirationDays;
  }
  return cleaned;
}
