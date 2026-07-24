import { Card } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { updateHouseholdPreferences } from "@/app/actions/settings";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import styles from "./settings.module.css";

const timeZones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const canManage = context.role === "household_manager";

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Settings" title="Household Preferences" description="The shared details that keep dates, times, and household identity consistent." />
      {feedback.status ? <p role="status">Household preferences saved.</p> : null}
      {feedback.error ? <p role="alert">Those preferences could not be saved. Please review the form and try again.</p> : null}
      <FeatureSection title="Current household">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Household name" detail={context.householdName} variant="sage" />
          <SummaryCard title="Time zone" detail={context.timeZone} variant="neutral" />
          <SummaryCard title="Your role" detail={context.role.replaceAll("_", " ")} variant="blush" />
        </ResponsiveGrid>
      </FeatureSection>
      <FeatureSection title="Shared preferences" description={canManage ? "Changes apply to every member of this household." : "Only the household manager can change shared preferences."}>
        {canManage ? (
          <Card>
            <form action={updateHouseholdPreferences} className={styles.form}>
              <label>
                Household name
                <input name="name" defaultValue={context.householdName} required maxLength={120} />
              </label>
              <label>
                Household time zone
                <select name="timeZone" defaultValue={context.timeZone}>
                  {!timeZones.includes(context.timeZone) ? <option value={context.timeZone}>{context.timeZone}</option> : null}
                  {timeZones.map((timeZone) => <option key={timeZone} value={timeZone}>{timeZone}</option>)}
                </select>
              </label>
              <button type="submit">Save household preferences</button>
            </form>
          </Card>
        ) : (
          <p className="type-supporting">Ask the household manager when a shared setting needs to change.</p>
        )}
      </FeatureSection>
    </FeaturePage>
  );
}
