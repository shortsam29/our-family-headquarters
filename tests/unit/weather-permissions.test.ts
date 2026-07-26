import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const migration = readFileSync("supabase/migrations/20260726210000_household_weather.sql", "utf8");
const action = readFileSync("app/actions/weather.ts", "utf8");
describe("weather location privacy and permissions", () => { it("stores only city-level location fields with coordinate constraints", () => { expect(migration).toContain("weather_city"); expect(migration).toContain("weather_latitude between -90 and 90"); expect(migration).not.toMatch(/street|address_line|service_role/i); }); it("limits editing to the household manager", () => { expect(action).toContain('context.role !== "household_manager"'); expect(action).toContain('.eq("id", context.householdId)'); }); });