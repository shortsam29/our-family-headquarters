import Link from "next/link";
import { Card } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { FamilyMemberManager } from "@/components/family/FamilyMemberManager";
import { KenzieProfileManager } from "@/components/kenzie/KenzieProfileManager";
import { saveKenziePreferences } from "@/app/actions/kenzie";
import { updateHouseholdPreferences } from "@/app/actions/settings";
import { updateWeatherLocation } from "@/app/actions/weather";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getHouseholdInvitations, getManagedHouseholdMembers } from "@/lib/data/core";
import { getHouseholdMemberAccountEmails } from "@/lib/data/account-assistance";
import { getKenzieDashboard } from "@/lib/data/kenzie-dashboard";
import { getManagedKenzieAssociations } from "@/lib/kenzie/profiles/association";
import { getHouseholdWeatherLocation } from "@/lib/weather/service";
import styles from "./settings.module.css";

const timeZones = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "UTC"];
const weatherErrors: Record<string, string> = {
  permission: "Only the household manager can change the family weather location.",
  validation: "Please enter a city and country.",
  "not-found": "We could not find that location. Check the city, region, and country, then try again.",
  service: "Weather location lookup is unavailable right now.",
  save: "The weather location could not be saved. Please try again.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ weatherStatus?: string; weatherError?: string }>;
}) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const canManage = ["household_manager", "parent"].includes(context.role);
  const canManageWeather = context.role === "household_manager";
  const [members, invitations, kenzie, weatherLocation, memberAccounts, associations] = await Promise.all([
    getManagedHouseholdMembers(context),
    getHouseholdInvitations(context),
    getKenzieDashboard(context),
    getHouseholdWeatherLocation(context),
    getHouseholdMemberAccountEmails(context),
    getManagedKenzieAssociations(context),
  ]);
  const accountEmails = Object.fromEntries(memberAccounts.map((account) => [account.memberId, account.email]));

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Administration" title="Settings" description="Household access, preferences, personalization, help, and account controls." />
      <FeatureSection title="Household settings">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Household" detail={context.householdName} />
          <SummaryCard title="Time zone" detail={context.timeZone} />
          <SummaryCard title="Your role" detail={context.role.replaceAll("_", " ")} />
        </ResponsiveGrid>
        {canManage ? (
          <Card>
            <form action={updateHouseholdPreferences} className={styles.form}>
              <label>Household name<input name="name" defaultValue={context.householdName} required maxLength={120} /></label>
              <label>
                Time zone
                <select name="timeZone" defaultValue={context.timeZone}>
                  {!timeZones.includes(context.timeZone) ? <option>{context.timeZone}</option> : null}
                  {timeZones.map((zone) => <option key={zone}>{zone}</option>)}
                </select>
              </label>
              <button>Save household preferences</button>
            </form>
          </Card>
        ) : null}
      </FeatureSection>

      <FeatureSection title="Household weather location" description="Weather uses a city-level location. A precise home address is never requested or stored.">
        <div id="weather-location">
          <ResponsiveGrid columns={2}>
            <SummaryCard title="Weather location" detail={weatherLocation?.displayName ?? "Not chosen"} variant="sage" />
            <SummaryCard title="Temperature unit" detail={weatherLocation?.temperatureUnit === "celsius" ? "Celsius" : "Fahrenheit"} variant="neutral" />
          </ResponsiveGrid>
          {feedback.weatherStatus ? <p role="status">Your household weather location is ready.</p> : null}
          {feedback.weatherError ? <p role="alert">{weatherErrors[feedback.weatherError] ?? "The weather location could not be updated."}</p> : null}
          {canManageWeather ? (
            <Card>
              <form action={updateWeatherLocation} className={styles.form}>
                <label>City<input name="city" defaultValue={weatherLocation?.city} required maxLength={100} autoComplete="address-level2" /></label>
                <label>State or region<input name="region" defaultValue={weatherLocation?.region} maxLength={100} autoComplete="address-level1" /></label>
                <label>Postal code (optional)<input name="postalCode" defaultValue={weatherLocation?.postalCode} maxLength={20} autoComplete="postal-code" /></label>
                <label>Country<input name="country" defaultValue={weatherLocation?.country ?? "United States"} required maxLength={100} autoComplete="country-name" /></label>
                <label>
                  Preferred temperature unit
                  <select name="temperatureUnit" defaultValue={weatherLocation?.temperatureUnit ?? "fahrenheit"}>
                    <option value="fahrenheit">Fahrenheit</option>
                    <option value="celsius">Celsius</option>
                  </select>
                </label>
                <button>Save weather location</button>
              </form>
            </Card>
          ) : <Card><p>A household manager can update this shared location.</p></Card>}
        </div>
      </FeatureSection>

      {canManage ? (
        <FeatureSection title="Manage members, roles, join codes, and invitations">
          <FamilyMemberManager members={members} currentMemberId={context.familyMemberId} invitations={invitations} accountEmails={accountEmails} />
        </FeatureSection>
      ) : null}

      {canManage ? (
        <FeatureSection title="Family and Kenzie preferences">
          <Card>
            <form action={saveKenziePreferences} className={styles.form}>
              <label>Greeting style<select name="greetingStyle" defaultValue={kenzie.preferences.greetingStyle}><option value="warm">Warm</option><option value="brief">Brief</option><option value="playful">Playful</option></select></label>
              <label>Reminder style<select name="reminderStyle" defaultValue={kenzie.preferences.reminderStyle}><option value="gentle">Gentle</option><option value="direct">Direct</option><option value="minimal">Minimal</option></select></label>
              <label>Planning detail<select name="planningBehavior" defaultValue={kenzie.preferences.planningBehavior}><option value="minimal">Minimal</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
              <button>Save family preferences</button>
            </form>
          </Card>
        </FeatureSection>
      ) : null}

      {canManage ? (
        <FeatureSection title="Kenzie profile assignments" description="Assign approved personalization only after a family member has joined and signed in.">
          <Card><KenzieProfileManager members={members} associations={associations} /></Card>
        </FeatureSection>
      ) : null}

      <FeatureSection title="Kenzie privacy">
        <Card>
          <p>Kenzie conversations are not stored as durable memory. Personal memory controls remain off until private ownership, consent, and deletion are fully available.</p>
          <p><Link href="/notifications">Open in-app notification preferences and updates →</Link></p>
        </Card>
      </FeatureSection>
      <FeatureSection title="API integrations">
        <Card><p className="type-supporting">Open-Meteo weather is connected without an API key. External calendar, banking, email, and notification providers are not connected.</p></Card>
      </FeatureSection>
      <FeatureSection title="Help, about, and account">
        <p><Link href="/help">Open Help & About →</Link></p>
      </FeatureSection>
    </FeaturePage>
  );
}
