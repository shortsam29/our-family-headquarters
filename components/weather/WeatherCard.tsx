import Link from "next/link";
import TodayCard from "@/components/today/TodayCard";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { getHouseholdWeather } from "@/lib/weather/service";
import type { HouseholdWeatherState } from "@/lib/weather/types";
import styles from "./WeatherCard.module.css";

export function WeatherLoadingCard() { return <TodayCard title="Weather" eyebrow="Right now" variant="sage" className={styles.card}><div className={styles.state} aria-live="polite"><span className={styles.loadingMark} aria-hidden="true"/><p>Checking the weather?</p></div></TodayCard>; }

export async function HouseholdWeatherCard({ context }: { context: CurrentHouseholdContext }) { const state = await getHouseholdWeather(context); return <WeatherCard state={state} canConfigure={context.role === "household_manager"}/>; }

export function WeatherCard({ state, canConfigure }: { state: HouseholdWeatherState; canConfigure: boolean }) {
  if (state.status === "no-location") return <TodayCard title="Weather" eyebrow="Right now" variant="sage" className={styles.card}><div className={styles.state}><span className={styles.icon} aria-hidden="true">○</span><h3>Choose your household weather location.</h3><p>{canConfigure ? "Add a city in Settings to see useful weather here." : "A household manager can choose the family weather location in Settings."}</p>{canConfigure ? <Link href="/settings#weather-location">Choose location</Link> : null}</div></TodayCard>;
  if (state.status === "unavailable") return <TodayCard title="Weather" eyebrow="Right now" variant="sage" className={styles.card}><div className={styles.state}><span className={styles.icon} aria-hidden="true">○</span><h3>Weather is unavailable right now.</h3><Link href="/">Try again</Link></div></TodayCard>;
  const weather = state.data;
  return <TodayCard title="Weather" eyebrow="Right now" variant="sage" className={styles.card}><Link className={styles.detailsLink} href="/weather" aria-label={`Open weather details for ${weather.location.displayName}`}><p className={styles.location}>{weather.location.displayName}</p><div className={styles.current}><span className={styles.icon} role="img" aria-label={weather.current.condition.label}>{weather.current.condition.icon}</span><strong>{Math.round(weather.current.temperature)}{weather.unitSymbol}</strong></div><p className={styles.condition}>{weather.current.condition.label}</p><p>Feels like {Math.round(weather.current.feelsLike)}{weather.unitSymbol}</p><p>High {Math.round(weather.today.high)}{weather.unitSymbol} · Low {Math.round(weather.today.low)}{weather.unitSymbol}</p><p>{weather.today.precipitationProbability}% chance of precipitation</p><p className={styles.note}>{weather.practicalNote}</p>{weather.stale ? <small>Last updated {new Date(weather.updatedAt).toLocaleString()}. Weather may be out of date.</small> : null}<span className={styles.open}>Weather details →</span></Link></TodayCard>;
}