import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20260730050000_kenzie_private_personal_memory.sql", "utf8");
const candidateSql = readFileSync("supabase/migrations/20260730051000_kenzie_memory_message_idempotency.sql", "utf8");
const candidateFixSql = readFileSync("supabase/migrations/20260730052000_kenzie_memory_candidate_idempotency_fix.sql", "utf8");

describe("private Kenzie memory migration", () => {
  it("creates separate owner-scoped settings and memory tables with RLS", () => {
    expect(sql).toContain("create table if not exists public.kenzie_memory_settings");
    expect(sql).toContain("create table if not exists public.kenzie_personal_memories");
    expect(sql).toContain("alter table public.kenzie_memory_settings enable row level security");
    expect(sql).toContain("alter table public.kenzie_personal_memories enable row level security");
  });

  it("binds every policy to the authenticated family member UUID", () => {
    expect(sql.match(/owner_family_member_id = public\.current_family_member_id\(household_id\)/g)?.length).toBeGreaterThanOrEqual(8);
    expect(sql).not.toContain("current_member_role");
    expect(sql).not.toContain("display_name");
    expect(sql).not.toContain("email");
  });

  it("constrains categories, lifecycle, expiration, and deduplication", () => {
    expect(sql).toContain("'learning_preference'");
    expect(sql).toContain("durability in ('durable', 'temporary')");
    expect(sql).toContain("status in ('active', 'superseded', 'deleted')");
    expect(sql).toContain("kenzie_personal_memories_source_once_idx");
    expect(sql).toContain("kenzie_personal_memories_active_subject_idx");
    expect(sql).toContain("on delete cascade");
    expect(candidateSql).toContain("kenzie_personal_memories_source_candidate_uidx");
    expect(candidateSql).toContain("source_message_id");
    expect(candidateSql).toContain("category");
    expect(candidateSql).toContain("subject");
    expect(candidateFixSql).toContain("drop index if exists public.kenzie_personal_memories_source_once_idx");
  });
});
