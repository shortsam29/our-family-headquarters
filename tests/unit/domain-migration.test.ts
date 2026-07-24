import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260724140000_domain_completion.sql"), "utf8");

describe("domain completion migration", () => {
  it.each([
    "recipes", "recipe_ingredients", "meal_plans", "meal_plan_entries",
    "shopping_lists", "shopping_list_items", "pets", "pet_care_reminders",
    "household_contacts", "vehicles", "vehicle_reminders", "vault_documents",
    "finance_obligations",
  ])("creates and protects %s", (table) => {
    expect(migration).toContain(`create table public.${table}`);
    expect(migration).toContain(`alter table public.%I enable row level security`);
  });

  it("uses a constrained authenticated onboarding function", () => {
    expect(migration).toContain("create or replace function public.create_first_household");
    expect(migration).toContain("User already belongs to a household");
    expect(migration).toContain("grant execute on function public.create_first_household(text,text,text) to authenticated");
  });

  it("contains no destructive reset operations", () => {
    expect(migration).not.toMatch(/\b(drop table|truncate|delete from)\b/i);
  });
});
