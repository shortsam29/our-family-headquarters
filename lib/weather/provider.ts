import { z } from "zod";
import type { DailyWeather, HouseholdWeather, HouseholdWeatherLocation, HourlyWeather, TemperatureUnit, WeatherCondition } from "@/lib/weather/types";

const geocodingSchema = z.object({ results: z.array(z.object({ name: z.string(), latitude: z.number(), longitude: z.number(), timezone: z.string(), country: z.string(), admin1: z.string().optional(), postcodes: z.array(z.string()).optional() })).optional() });
const currentSchema = z.object({ time: z.string(), temperature_2m: z.number(), apparent_temperature: z.number(), weather_code: z.number(), precipitation: z.number(), rain: z.number(), snowfall: z.number(), wind_speed_10m: z.number(), wind_gusts_10m: z.number(), is_day: z.number() });
const hourlySchema = z.object({ time: z.array(z.string()), temperature_2m: z.array(z.number()), apparent_temperature: z.array(z.number()), precipitation_probability: z.array(z.number().nullable()), precipitation: z.array(z.number()), rain: z.array(z.number()), snowfall: z.array(z.number()), weather_code: z.array(z.number()), wind_speed_10m: z.array(z.number()), wind_gusts_10m: z.array(z.number()), is_day: z.array(z.number()) });
const dailySchema = z.object({ time: z.array(z.string()), weather_code: z.array(z.number()), temperature_2m_max: z.array(z.number()), temperature_2m_min: z.array(z.number()), precipitation_probability_max: z.array(z.number().nullable()), precipitation_sum: z.array(z.number()), sunrise: z.array(z.string()), sunset: z.array(z.string()), uv_index_max: z.array(z.number().nullable()) });
const forecastSchema = z.object({ timezone: z.string(), current: currentSchema, hourly: hourlySchema, daily: dailySchema });

export function describeWeatherCode(code: number): WeatherCondition {
  if (code === 0) return { code, label: "Clear", icon: "☀" };
  if ([1, 2].includes(code)) return { code, label: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { code, label: "Cloudy", icon: "☁" };
  if ([45, 48].includes(code)) return { code, label: "Foggy", icon: "≋" };
  if ([51, 53, 55, 56, 57].includes(code)) return { code, label: "Drizzle", icon: "🌦" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { code, label: "Rain", icon: "🌧" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { code, label: "Snow", icon: "❄" };
  if ([95, 96, 99].includes(code)) return { code, label: "Thunderstorms", icon: "⛈" };
  return { code, label: "Changing weather", icon: "◌" };
}

export function transformGeocodingResponse(input: unknown, request: { city: string; region?: string; postalCode?: string; country: string; temperatureUnit: TemperatureUnit }): HouseholdWeatherLocation {
  const parsed = geocodingSchema.parse(input);
  const candidates = parsed.results ?? [];
  const country = request.country.trim().toLowerCase();
  const region = request.region?.trim().toLowerCase();
  const postal = request.postalCode?.trim().toLowerCase();
  const match = candidates.find((item) => item.country.toLowerCase() === country && (!region || item.admin1?.toLowerCase() === region) && (!postal || item.postcodes?.some((code) => code.toLowerCase() === postal)))
    ?? candidates.find((item) => item.country.toLowerCase() === country && (!region || item.admin1?.toLowerCase() === region))
    ?? candidates.find((item) => item.country.toLowerCase() === country)
    ?? candidates[0];
  if (!match) throw new Error("LOCATION_NOT_FOUND");
  return { city: match.name, region: match.admin1, postalCode: request.postalCode?.trim() || undefined, country: match.country, displayName: [match.name, match.admin1, match.country].filter(Boolean).join(", "), latitude: match.latitude, longitude: match.longitude, timeZone: match.timezone, temperatureUnit: request.temperatureUnit };
}

function dailyAt(raw: z.infer<typeof dailySchema>, index: number): DailyWeather {
  return { date: raw.time[index], high: raw.temperature_2m_max[index], low: raw.temperature_2m_min[index], precipitationProbability: raw.precipitation_probability_max[index] ?? 0, precipitation: raw.precipitation_sum[index], sunrise: raw.sunrise[index], sunset: raw.sunset[index], uvIndex: raw.uv_index_max[index] ?? undefined, condition: describeWeatherCode(raw.weather_code[index]) };
}

export function practicalWeatherNote(weather: Pick<HouseholdWeather, "current" | "today" | "location">) {
  if (weather.current.condition.label === "Thunderstorms") return "Thunderstorms may affect time outdoors today.";
  if (weather.current.snowfall > 0 || weather.current.condition.label === "Snow") return "Snow may make travel and outdoor plans slower today.";
  if (weather.today.precipitationProbability >= 60) return "Rain is likely today. A light layer may help.";
  const heatThreshold = weather.location.temperatureUnit === "fahrenheit" ? 95 : 35;
  const freezeThreshold = weather.location.temperatureUnit === "fahrenheit" ? 32 : 0;
  if (weather.today.high >= heatThreshold) return "It will feel especially hot today. Plan extra water and shade.";
  if (weather.today.low <= freezeThreshold) return "Temperatures may fall below freezing tonight.";
  if (["Clear", "Partly cloudy"].includes(weather.current.condition.label)) return "Clear and comfortable weather is settling in.";
  return "A quick look outside can help the family plan the day.";
}

export function transformForecastResponse(input: unknown, location: HouseholdWeatherLocation, now = new Date()): HouseholdWeather {
  const raw = forecastSchema.parse(input);
  const today = raw.daily.time[0];
  if (!today) throw new Error("FORECAST_EMPTY");
  const current: HouseholdWeather["current"] = { temperature: raw.current.temperature_2m, feelsLike: raw.current.apparent_temperature, precipitation: raw.current.precipitation, rain: raw.current.rain, snowfall: raw.current.snowfall, windSpeed: raw.current.wind_speed_10m, windGusts: raw.current.wind_gusts_10m, isDay: raw.current.is_day === 1, condition: describeWeatherCode(raw.current.weather_code) };
  const daily = raw.daily.time.map((_, index) => dailyAt(raw.daily, index));
  const hourly: HourlyWeather[] = raw.hourly.time.map((time, index) => ({ time, temperature: raw.hourly.temperature_2m[index], feelsLike: raw.hourly.apparent_temperature[index], precipitationProbability: raw.hourly.precipitation_probability[index] ?? 0, precipitation: raw.hourly.precipitation[index], condition: describeWeatherCode(raw.hourly.weather_code[index]), windSpeed: raw.hourly.wind_speed_10m[index], windGusts: raw.hourly.wind_gusts_10m[index], isDay: raw.hourly.is_day[index] === 1 })).filter((item) => item.time.slice(0, 10) === today && item.time >= raw.current.time);
  const result: HouseholdWeather = { location: { ...location, timeZone: raw.timezone }, unitSymbol: location.temperatureUnit === "fahrenheit" ? "°F" : "°C", precipitationUnit: location.temperatureUnit === "fahrenheit" ? "in" : "mm", windUnit: location.temperatureUnit === "fahrenheit" ? "mph" : "km/h", current, today: daily[0], hourly, daily, practicalNote: "", updatedAt: now.toISOString(), stale: false };
  result.practicalNote = practicalWeatherNote(result);
  return result;
}