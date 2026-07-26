import type { ScheduleEvent } from "@/types/features";
import type { HouseholdWeather } from "@/lib/weather/types";

const outdoorWords = /soccer|practice|game|park|outdoor|walk|hike|picnic|garden|field|camp/i;
export function buildKenzieWeatherGuidance(weather: HouseholdWeather, events: ScheduleEvent[]) {
  const todayEvents = events.filter((event) => event.date === weather.today.date);
  const outdoor = todayEvents.find((event) => outdoorWords.test(`${event.title} ${event.description ?? ""} ${event.location ?? ""}`));
  const rainLikely = weather.today.precipitationProbability >= 60 || weather.current.rain > 0;
  if (rainLikely && outdoor) return `Rain is expected near ${outdoor.title}. Packing a light rain jacket may help.`;
  if ((weather.current.snowfall > 0 || weather.current.condition.label === "Snow") && todayEvents.length) return "Snow may affect travel for today’s plans. Leaving a little extra time may help.";
  if (weather.current.condition.label === "Thunderstorms" && outdoor) return `Thunderstorms may affect ${outdoor.title}. Check conditions before heading out.`;
  const heatThreshold = weather.location.temperatureUnit === "fahrenheit" ? 95 : 35;
  const freezeThreshold = weather.location.temperatureUnit === "fahrenheit" ? 32 : 0;
  if (weather.today.high >= heatThreshold && outdoor) return `It will be especially hot near ${outdoor.title}. Water and a little shade may help.`;
  if (weather.today.low <= freezeThreshold && todayEvents.length) return "Temperatures may fall below freezing. Coats may make today?s outings more comfortable.";
  return undefined;
}