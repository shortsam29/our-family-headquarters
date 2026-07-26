import { describe, expect, it } from "vitest";
import { buildKenzieWeatherGuidance } from "@/lib/weather/kenzie";
import type { HouseholdWeather } from "@/lib/weather/types";
import type { ScheduleEvent } from "@/types/features";

const baseWeather = { location: { temperatureUnit: "fahrenheit" }, current: { condition: { label: "Rain" }, rain: 1, snowfall: 0 }, today: { date: "2026-07-26", precipitationProbability: 80, high: 78, low: 60 } } as HouseholdWeather;
const outdoor: ScheduleEvent = { id: "event", title: "Soccer practice", date: "2026-07-26", allDay: false, category: "family", ownerId: "member", participantIds: ["member"], scope: "household" };
describe("Kenzie weather relevance", () => { it("mentions rain when it overlaps an outdoor event", () => { expect(buildKenzieWeatherGuidance(baseWeather, [outdoor])).toMatch(/Soccer practice/); }); it("stays quiet when weather is not practically relevant", () => { const calm = { ...baseWeather, current: { ...baseWeather.current, condition: { code: 0, label: "Clear", icon: "sun" }, rain: 0 }, today: { ...baseWeather.today, precipitationProbability: 10 } } as HouseholdWeather; expect(buildKenzieWeatherGuidance(calm, [])).toBeUndefined(); }); });