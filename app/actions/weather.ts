"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geocodeHouseholdLocation } from "@/lib/weather/service";

const weatherLocationSchema = z.object({ city: z.string().trim().min(2).max(100), region: z.string().trim().max(100).optional(), postalCode: z.string().trim().max(20).optional(), country: z.string().trim().min(2).max(100), temperatureUnit: z.enum(["fahrenheit", "celsius"]) });

export async function updateWeatherLocation(formData: FormData) {
  const context = await requireCurrentHouseholdContext();
  if (context.role !== "household_manager") redirect("/settings?weatherError=permission#weather-location");
  const parsed = weatherLocationSchema.safeParse({ city: formData.get("city"), region: String(formData.get("region") ?? "") || undefined, postalCode: String(formData.get("postalCode") ?? "") || undefined, country: formData.get("country"), temperatureUnit: formData.get("temperatureUnit") });
  if (!parsed.success) redirect("/settings?weatherError=validation#weather-location");
  let location;
  try { location = await geocodeHouseholdLocation(parsed.data); }
  catch (error) { console.error("Weather location resolution failed", error instanceof Error ? error.message : "unknown"); redirect("/settings?weatherError=not-found#weather-location"); }
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/settings?weatherError=service#weather-location");
  const { error } = await supabase.from("households").update({ weather_city: location.city, weather_region: location.region ?? null, weather_postal_code: location.postalCode ?? null, weather_country: location.country, weather_display_name: location.displayName, weather_latitude: location.latitude, weather_longitude: location.longitude, weather_time_zone: location.timeZone, weather_temperature_unit: location.temperatureUnit }).eq("id", context.householdId);
  if (error) { console.error("Weather location save failed", error.code); redirect("/settings?weatherError=save#weather-location"); }
  for (const path of ["/", "/weather", "/kenzie", "/settings"]) revalidatePath(path);
  redirect("/settings?weatherStatus=saved#weather-location");
}