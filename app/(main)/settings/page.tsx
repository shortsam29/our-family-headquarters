import Link from "next/link";
import { Card } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { FamilyMemberManager } from "@/components/family/FamilyMemberManager";
import { KenzieProfileManager } from "@/components/kenzie/KenzieProfileManager";
import { PersonalMemoryManager } from "@/components/kenzie/PersonalMemoryManager";
import { saveKenziePreferences } from "@/app/actions/kenzie";
import { updateHouseholdPreferences } from "@/app/actions/settings";
import { updateWeatherLocation } from "@/app/actions/weather";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getHouseholdInvitations, getManagedHouseholdMembers } from "@/lib/data/core";
import { getHouseholdMemberAccountEmails } from "@/lib/data/account-assistance";
import { getKenzieDashboard } from "@/lib/data/kenzie-dashboard";
import { getManagedKenzieAssociations } from "@/lib/kenzie/profiles/association";
import { getMemorySettings, listActiveMemories } from "@/lib/kenzie/memory/service";
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
  searchParams: Promise<{ weatherStatus?: string; weatherError?: string; setup?: string }>;
}) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const canManage = ["household_manager", "parent"].includes(context.role);
  const canManageWeather = context.role === "household_manager";
  const [members, invitations, kenzie, weatherLocation, memberAccounts, associations, memorySettings, personalMemories] = await Promise.all([
    getManagedHouseholdMembers(context),
    getHouseholdInvitations(context),
    getKenzieDashboard(context),
    getHouseholdWeatherLocation(context),
    getHouseholdMemberAccountEmails(context),
    getManagedKenzieAssociations(context),
    getMemorySettings(context),
    listActiveMemories(context),
  ]);
  const accountEmails = Object.fromEntries(memberAccounts.map((account) => [account.memberId, account.email]));

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Administration" title="Settings" description="Household access, preferences, personalization, help, and account controls." />
      {feedback.setup ? (
        <FeatureSection title={canManage ? "Finish setting up your family home" : "Welcome to your family home"} description="A short checklist will help make the app personal, useful, and ready for everyday life.">
          <ol className={styles.setupSteps}>
            {canManage ? <>
              <li><strong>Confirm the household details</strong><span>Review the family name and time zone.</span><Link href="/settings#household-settings">Review household settings →</Link></li>
              <li><strong>Add or invite family members</strong><span>Create their family membership and choose the correct household role.</span><Link href="/settings#member-management">Manage family members →</Link></li>
              <li><strong>Assign Kenzie personalization</strong><span>After a member joins, connect their trusted membership to the correct typed Kenzie profile.</span><Link href="/settings#kenzie-profile-assignment">Assign Kenzie profiles →</Link></li>
              <li><strong>Choose shared preferences</strong><span>Set weather and family planning preferences without entering a precise home address.</span><Link href="/settings#weather-location">Choose shared preferences →</Link></li>
              <li><strong>Plan the first family item</strong><span>Use Quick Add from any signed-in page or open the calendar directly.</span><Link href="/schedule">Open the calendar →</Link></li>
            </> : <>
              <li><strong>Confirm your family connection</strong><span>Your account is connected through your authenticated household membership.</span><Link href="/settings#household-settings">View household details →</Link></li>
              <li><strong>Open your personal headquarters</strong><span>See only the schedule, responsibilities, reminders, and private Kenzie notes intended for you.</span><Link href="/my-headquarters">Open My Headquarters →</Link></li>
              <li><strong>Meet Kenzie</strong><span>Ask a general question or request household help within your permissions.</span><Link href="/kenzie">Talk with Kenzie →</Link></li>
              <li><strong>Check your notifications</strong><span>Your private reminders and Kenzie notes appear here.</span><Link href="/notifications">Open notifications →</Link></li>
              <li><strong>Review Kenzie privacy</strong><span>Learn what Kenzie can access and what remains intentionally unavailable.</span><Link href="/settings#kenzie-privacy">Review privacy →</Link></li>
            </>}
          </ol>
        </FeatureSection>
      ) : null}
      <div id="household-settings">
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
      </div>

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
        <div id="member-management">
        <FeatureSection title="Manage members, roles, join codes, and invitations">
          <FamilyMemberManager members={members} currentMemberId={context.familyMemberId} invitations={invitations} accountEmails={accountEmails} />
        </FeatureSection>
        </div>
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
        <div id="kenzie-profile-assignment">
        <FeatureSection title="Kenzie profile assignments" description="Assign approved personalization only after a family member has joined and signed in.">
          <Card><KenzieProfileManager members={members} associations={associations} /></Card>
        </FeatureSection>
        </div>
      ) : null}

      <div id="kenzie-memory"><FeatureSection title="What Kenzie Remembers" description="Your private, personal memory controls. Other family members and household managers cannot open this list.">
        <PersonalMemoryManager settings={memorySettings} memories={personalMemories} />
      </FeatureSection></div>

      <div id="kenzie-privacy"><FeatureSection title="Kenzie privacy">
        <Card>
          <p>Kenzie may save concise, useful personal preferences after you acknowledge the first-use notice. Full conversations are not stored, and sensitive information is rejected.</p>
          <p>Each family member&apos;s memories are private to their authenticated account. Household managers do not receive blanket access.</p>
          <p><Link href="/notifications">Open in-app notification preferences and updates →</Link></p>
        </Card>
      </FeatureSection></div>
      <FeatureSection title="API integrations">
        <Card><p className="type-supporting">Open-Meteo weather is connected without an API key. External calendar, banking, email, and notification providers are not connected.</p></Card>
      </FeatureSection>
      <FeatureSection title="Help, about, and account">
        <p><Link href="/help">Open Help & About →</Link></p>
      </FeatureSection>
    </FeaturePage>
  );
}
