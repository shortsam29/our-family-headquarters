import { z } from "zod";

export const temperatureUnitSchema = z.enum(["fahrenheit", "celsius"]);
export type TemperatureUnit = z.infer<typeof temperatureUnitSchema>;

export type HouseholdWeatherLocation = {
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  displayName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  temperatureUnit: TemperatureUnit;
};

export type WeatherCondition = { code: number; label: string; icon: string };
export type HourlyWeather = { time: string; temperature: number; feelsLike: number; precipitationProbability: number; precipitation: number; condition: WeatherCondition; windSpeed: number; windGusts: number; isDay: boolean };
export type DailyWeather = { date: string; high: number; low: number; precipitationProbability: number; precipitation: number; sunrise: string; sunset: string; uvIndex?: number; condition: WeatherCondition };
export type HouseholdWeather = {
  location: HouseholdWeatherLocation;
  unitSymbol: "°F" | "°C";
  precipitationUnit: "in" | "mm";
  windUnit: "mph" | "km/h";
  current: { temperature: number; feelsLike: number; precipitation: number; rain: number; snowfall: number; windSpeed: number; windGusts: number; isDay: boolean; condition: WeatherCondition };
  today: DailyWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  practicalNote: string;
  updatedAt: string;
  stale: boolean;
};

export type HouseholdWeatherState =
  | { status: "populated"; data: HouseholdWeather }
  | { status: "no-location" }
  | { status: "unavailable" };