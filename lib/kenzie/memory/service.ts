import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemoryCandidate, MemoryCategory, MemorySettings, PersonalMemory } from "./types";
import { defaultMemorySettings } from "./types";
import { containsProhibitedMemoryContent, sanitizeMemoryText, validateMemoryCandidate } from "./safety";

function mapMemory(row: Record<string, unknown>): PersonalMemory {
  return {
    id: String(row.id),
    category: row.category as MemoryCategory,
    subject: String(row.subject),
    normalizedValue: String(row.normalized_value),
    displayText: String(row.display_text),
    durability: row.durability as PersonalMemory["durability"],
    confidence: row.confidence as PersonalMemory["confidence"],
    expiresAt: row.expires_at ? String(row.expires_at) : undefined,
    updatedAt: String(row.updated_at),
  };
}

export async function getMemorySettings(context: CurrentHouseholdContext): Promise<MemorySettings> {
  if (context.source !== "supabase") return defaultMemorySettings;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return defaultMemorySettings;
  const { data } = await supabase.from("kenzie_memory_settings")
    .select("automatic_memory_enabled,first_use_notice_acknowledged_at,paused_at")
    .eq("household_id", context.householdId)
    .eq("owner_family_member_id", context.familyMemberId)
    .maybeSingle();
  return data ? {
    enabled: data.automatic_memory_enabled,
    acknowledgedAt: data.first_use_notice_acknowledged_at ?? undefined,
    pausedAt: data.paused_at ?? undefined,
  } : defaultMemorySettings;
}

export async function setMemorySettings(
  context: CurrentHouseholdContext,
  input: { enabled?: boolean; acknowledge?: boolean },
) {
  if (context.source !== "supabase") return false;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const now = new Date().toISOString();
  const current = await getMemorySettings(context);
  const enabled = input.enabled ?? current.enabled;
  const { error } = await supabase.from("kenzie_memory_settings").upsert({
    household_id: context.householdId,
    owner_family_member_id: context.familyMemberId,
    automatic_memory_enabled: enabled,
    first_use_notice_acknowledged_at: input.acknowledge ? current.acknowledgedAt ?? now : current.acknowledgedAt ?? null,
    paused_at: enabled ? null : current.pausedAt ?? now,
  }, { onConflict: "household_id,owner_family_member_id" });
  return !error;
}

export async function listActiveMemories(context: CurrentHouseholdContext): Promise<PersonalMemory[]> {
  if (context.source !== "supabase") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("kenzie_personal_memories")
    .select("id,category,subject,normalized_value,display_text,durability,confidence,expires_at,updated_at")
    .eq("household_id", context.householdId)
    .eq("owner_family_member_id", context.familyMemberId)
    .eq("status", "active")
    .is("deleted_at", null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("updated_at", { ascending: false })
    .limit(100);
  return error ? [] : (data ?? []).map((row) => mapMemory(row as Record<string, unknown>));
}

export async function saveMemoryCandidate(
  context: CurrentHouseholdContext,
  rawCandidate: MemoryCandidate,
  source: { conversationId: string; messageId: string },
) {
  const candidate = validateMemoryCandidate(rawCandidate, context.role);
  if (!candidate || context.source !== "supabase") return null;
  const settings = await getMemorySettings(context);
  if (!settings.enabled || !settings.acknowledgedAt) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: sourceExisting } = await supabase.from("kenzie_personal_memories")
    .select("id").eq("household_id", context.householdId)
    .eq("owner_family_member_id", context.familyMemberId)
    .eq("source_message_id", source.messageId)
    .eq("category", candidate.category)
    .eq("subject", candidate.subject)
    .maybeSingle();
  if (sourceExisting) return null;
  const now = new Date();
  const expiresAt = candidate.durability === "temporary"
    ? new Date(now.getTime() + (candidate.expirationDays ?? 30) * 86400000).toISOString()
    : null;
  const { data: existing } = await supabase.from("kenzie_personal_memories")
    .select("id,normalized_value,confidence").eq("household_id", context.householdId)
    .eq("owner_family_member_id", context.familyMemberId)
    .eq("category", candidate.category).eq("subject", candidate.subject)
    .eq("status", "active").is("deleted_at", null).maybeSingle();
  if (existing) {
    const same = existing.normalized_value === candidate.normalizedValue;
    const { error } = await supabase.from("kenzie_personal_memories").update({
      normalized_value: candidate.normalizedValue,
      display_text: candidate.displayText,
      confidence: same && existing.confidence === "high" ? "high" : candidate.confidence,
      durability: candidate.durability,
      sensitivity: candidate.sensitivity,
      source_conversation_id: source.conversationId,
      source_message_id: source.messageId,
      source_type: "conversation",
      last_observed_at: now.toISOString(),
      expires_at: expiresAt,
    }).eq("id", existing.id).eq("household_id", context.householdId)
      .eq("owner_family_member_id", context.familyMemberId);
    return error ? null : { id: existing.id, displayText: candidate.displayText, updated: true };
  }
  const { data, error } = await supabase.from("kenzie_personal_memories").insert({
    household_id: context.householdId,
    owner_family_member_id: context.familyMemberId,
    category: candidate.category,
    subject: candidate.subject,
    normalized_value: candidate.normalizedValue,
    display_text: candidate.displayText,
    confidence: candidate.confidence,
    sensitivity: candidate.sensitivity,
    durability: candidate.durability,
    status: "active",
    source_type: "conversation",
    source_conversation_id: source.conversationId,
    source_message_id: source.messageId,
    expires_at: expiresAt,
  }).select("id").single();
  return error || !data ? null : { id: data.id, displayText: candidate.displayText, updated: false };
}

export async function findRelevantMemories(context: CurrentHouseholdContext, prompt: string) {
  const memories = await listActiveMemories(context);
  const terms = new Set(prompt.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const priority = new Set(["communication_preference", "learning_preference", "reminder_preference"]);
  return memories
    .map((memory) => ({
      memory,
      score: (priority.has(memory.category) ? 2 : 0)
        + [...terms].filter((term) => `${memory.subject} ${memory.normalizedValue}`.toLowerCase().includes(term)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ memory }) => ({ category: memory.category, fact: memory.displayText, confidence: memory.confidence }));
}

export async function updateOwnedMemory(context: CurrentHouseholdContext, id: string, displayText: string) {
  const cleaned = sanitizeMemoryText(displayText, 500);
  if (!cleaned || containsProhibitedMemoryContent(cleaned)) return false;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { error } = await supabase.from("kenzie_personal_memories").update({
    display_text: cleaned,
    normalized_value: cleaned.toLowerCase(),
    source_type: "user_edit",
    last_observed_at: new Date().toISOString(),
  }).eq("id", id).eq("household_id", context.householdId)
    .eq("owner_family_member_id", context.familyMemberId).eq("status", "active");
  return !error;
}

export async function deleteOwnedMemory(context: CurrentHouseholdContext, id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { error } = await supabase.from("kenzie_personal_memories").delete()
    .eq("id", id).eq("household_id", context.householdId)
    .eq("owner_family_member_id", context.familyMemberId);
  return !error;
}

export async function deleteAllOwnedMemories(context: CurrentHouseholdContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { error } = await supabase.from("kenzie_personal_memories").delete()
    .eq("household_id", context.householdId).eq("owner_family_member_id", context.familyMemberId)
    .eq("status", "active");
  return !error;
}

export async function forgetMatchingMemory(context: CurrentHouseholdContext, search: string) {
  const memories = await listActiveMemories(context);
  const normalized = search.toLowerCase();
  const matches = memories.filter((memory) =>
    `${memory.subject} ${memory.normalizedValue} ${memory.displayText}`.toLowerCase().includes(normalized));
  if (matches.length !== 1) return { deleted: false, count: matches.length };
  return { deleted: await deleteOwnedMemory(context, matches[0].id), count: 1 };
}
