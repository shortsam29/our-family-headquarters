import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { temperatureUnitSchema, type HouseholdWeather, type HouseholdWeatherLocation, type HouseholdWeatherState, type TemperatureUnit } from "@/lib/weather/types";
import { transformForecastResponse, transformGeocodingResponse } from "@/lib/weather/provider";

const FORECAST_REVALIDATE_SECONDS = 45 * 60;
const REQUEST_TIMEOUT_MS = 8000;
const memoryCache = new Map<string, HouseholdWeather>();

async function weatherFetch(url: URL) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), next: { revalidate: FORECAST_REVALIDATE_SECONDS } });
  if (!response.ok) throw new Error(`OPEN_METEO_${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function geocodeHouseholdLocation(request: { city: string; region?: string; postalCode?: string; country: string; temperatureUnit: TemperatureUnit }) {
  const query = request.city;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  return transformGeocodingResponse(await weatherFetch(url), request);
}

export async function getHouseholdWeatherLocation(context: CurrentHouseholdContext): Promise<HouseholdWeatherLocation | null> {
  if (context.source !== "supabase") return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("households").select("weather_city,weather_region,weather_postal_code,weather_country,weather_display_name,weather_latitude,weather_longitude,weather_time_zone,weather_temperature_unit").eq("id", context.householdId).maybeSingle();
  if (error || !data?.weather_display_name || data.weather_latitude == null || data.weather_longitude == null || !data.weather_time_zone) return null;
  const unit = temperatureUnitSchema.safeParse(data.weather_temperature_unit);
  return { city: data.weather_city ?? data.weather_display_name, region: data.weather_region ?? undefined, postalCode: data.weather_postal_code ?? undefined, country: data.weather_country ?? "", displayName: data.weather_display_name, latitude: data.weather_latitude, longitude: data.weather_longitude, timeZone: data.weather_time_zone, temperatureUnit: unit.success ? unit.data : "fahrenheit" };
}

export async function getForecast(location: HouseholdWeatherLocation): Promise<HouseholdWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", location.timeZone);
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("temperature_unit", location.temperatureUnit);
  url.searchParams.set("wind_speed_unit", location.temperatureUnit === "fahrenheit" ? "mph" : "kmh");
  url.searchParams.set("precipitation_unit", location.temperatureUnit === "fahrenheit" ? "inch" : "mm");
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,precipitation,rain,snowfall,wind_speed_10m,wind_gusts_10m,is_day");
  url.searchParams.set("hourly", "temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,snowfall,weather_code,wind_speed_10m,wind_gusts_10m,is_day");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max");
  const key = `${location.latitude},${location.longitude},${location.temperatureUnit}`;
  try {
    const weather = transformForecastResponse(await weatherFetch(url), location);
    memoryCache.set(key, weather);
    return weather;
  } catch (error) {
    const cached = memoryCache.get(key);
    if (cached) return { ...cached, stale: true };
    console.error("Open-Meteo forecast unavailable", error instanceof Error ? error.message : "unknown");
    throw new Error("WEATHER_UNAVAILABLE");
  }
}

export async function getHouseholdWeather(context: CurrentHouseholdContext): Promise<HouseholdWeatherState> {
  const location = await getHouseholdWeatherLocation(context);
  if (!location) return { status: "no-location" };
  try { return { status: "populated", data: await getForecast(location) }; }
  catch { return { status: "unavailable" }; }
}