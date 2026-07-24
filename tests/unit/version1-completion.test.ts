import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPriorityObservations } from "@/lib/data/kenzie-dashboard";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260724190000_version1_completion.sql"), "utf8");

describe("Version 1 completion", () => {
  it.each(["household_memories", "kenzie_preferences", "kenzie_tomorrow_plans"])("creates and protects %s", (table) => {
    expect(migration).toContain(`create table public.${table}`);
    expect(migration).toContain(`alter table public.${table} enable row level security`);
  });

  it("keeps Family Vault private and bounded", () => {
    expect(migration).toContain("'family-vault'");
    expect(migration).toContain("false,\n  20971520");
    expect(migration).toContain("family_vault_storage_read");
    expect(migration).toContain("family_vault_storage_insert");
  });

  it("contains no destructive reset operations", () => {
    expect(migration).not.toMatch(/\b(drop table|truncate|delete from)\b/i);
  });

  it("prioritizes a busy day and missing dinner without acting", () => {
    const observations = buildPriorityObservations({ scheduleCount: 5, taskCount: 2, completedCount: 0, shopping: 1, bills: 0, documents: 0, petCare: 0, vehicleCare: 0 });
    expect(observations[0]?.title).toBe("A full day");
    expect(observations.some((item) => item.title === "Dinner is still open")).toBe(true);
    expect(observations.every((item) => item.recommendation === undefined || !/^(Create|Delete|Complete|Purchase|Schedule|Assign)\b/.test(item.recommendation))).toBe(true);
  });

  it("limits the briefing to a calm number of observations", () => {
    const observations = buildPriorityObservations({ scheduleCount: 7, taskCount: 2, completedCount: 2, shopping: 8, bills: 2, documents: 2, petCare: 2, vehicleCare: 2 });
    expect(observations).toHaveLength(4);
    expect(observations.map((item) => item.score)).toEqual([...observations.map((item) => item.score)].sort((a, b) => b - a));
  });
});
