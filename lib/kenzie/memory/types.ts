import { z } from "zod";

export const memoryCategories = [
  "preference", "dislike", "communication_preference", "learning_preference",
  "reminder_preference", "routine", "hobby", "favorite", "personal_context",
  "accessibility_preference", "relationship_context", "temporary_context",
] as const;

export const memoryCandidateSchema = z.object({
  category: z.enum(memoryCategories),
  subject: z.string().trim().min(1).max(120),
  normalizedValue: z.string().trim().min(1).max(240),
  displayText: z.string().trim().min(1).max(500),
  durability: z.enum(["durable", "temporary"]),
  confidence: z.enum(["high", "medium"]),
  sensitivity: z.enum(["low", "moderate"]),
  expirationDays: z.number().int().min(7).max(90).optional(),
}).strict();

export const memoryExtractionSchema = z.object({
  candidates: z.array(memoryCandidateSchema).max(3),
}).strict();

export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;
export type MemoryCategory = (typeof memoryCategories)[number];

export type PersonalMemory = {
  id: string;
  category: MemoryCategory;
  subject: string;
  normalizedValue: string;
  displayText: string;
  durability: "durable" | "temporary";
  confidence: "high" | "medium";
  expiresAt?: string;
  updatedAt: string;
};

export type MemorySettings = {
  enabled: boolean;
  acknowledgedAt?: string;
  pausedAt?: string;
};

export const defaultMemorySettings: MemorySettings = { enabled: true };
