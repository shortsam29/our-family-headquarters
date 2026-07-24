import { deleteHouseholdMemory, saveHouseholdMemory, saveKenziePreferences } from "@/app/actions/kenzie";
import { Card, KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { PlanTomorrow } from "@/components/kenzie/PlanTomorrow";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getKenzieDashboard, type HouseholdMemory } from "@/lib/data/kenzie-dashboard";
import styles from "./kenzie.module.css";

const categoryLabels: Record<string, string> = {
  favorite_meal: "Favorite meal", disliked_meal: "Disliked meal", allergy: "Allergy",
  family_tradition: "Family tradition", vacation: "Vacation", birthday: "Birthday",
  anniversary: "Anniversary", grocery_store: "Preferred grocery store", shopping_habit: "Shopping habit",
  school_schedule: "School schedule", work_schedule: "Work schedule", morning_routine: "Morning routine",
  bedtime_routine: "Bedtime routine", trash_day: "Trash day", cleaning_schedule: "Cleaning schedule",
  vehicle_preference: "Vehicle preference", pet_routine: "Pet routine", holiday_tradition: "Holiday tradition",
  favorite_activity: "Favorite activity", family_note: "Family note",
};

function MemoryList({ items, canManage }: { items: HouseholdMemory[]; canManage: boolean }) {
  if (!items.length) return <p className={styles.quiet}>Nothing has been saved here yet.</p>;
  return <ul className={styles.memoryList}>{items.map((item) => (
    <li key={item.id}>
      <div><strong>{item.label}</strong><span>{item.value}</span><small>{categoryLabels[item.category] ?? item.category} · {item.visibility === "adults" ? "Parents only" : "Household"}</small></div>
      {canManage ? <form action={deleteHouseholdMemory.bind(null, item.id)}><button type="submit" className={styles.textButton}>Remove</button></form> : null}
    </li>
  ))}</ul>;
}

export default async function KenziePage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const [dashboard, feedback] = await Promise.all([getKenzieDashboard(context), searchParams]);
  const canManage = context.role === "household_manager" || context.role === "parent";
  const celebrations = dashboard.memories.filter((item) => ["birthday", "anniversary", "holiday_tradition"].includes(item.category));
  const traditions = dashboard.memories.filter((item) => ["family_tradition", "holiday_tradition", "favorite_activity"].includes(item.category));
  const routines = dashboard.memories.filter((item) => ["morning_routine", "bedtime_routine", "trash_day", "cleaning_schedule", "pet_routine", "school_schedule", "work_schedule"].includes(item.category));

  return <FeaturePage>
    <FeaturePageHeader eyebrow="A calm household briefing" title="Kenzie" description="Useful observations, family knowledge, and tomorrow planning—always waiting for your approval before anything changes." />
    {feedback.status ? <p role="status" className={styles.feedback}>Saved for the household.</p> : null}
    {feedback.error ? <p role="alert" className={styles.error}>That change could not be saved. Please review it and try again.</p> : null}

    <FeatureSection title="Today's Briefing">
      <KenzieNote title={dashboard.note.title} audience={dashboard.note.audience} message={dashboard.note.message} signature={dashboard.note.signature} />
    </FeatureSection>

    <FeatureSection title="Things To Know" description="Only the most useful observations rise to the top. Kenzie recommends; she never acts on her own.">
      {dashboard.observations.length ? <ResponsiveGrid columns={2}>{dashboard.observations.map((item) => (
        <SummaryCard key={item.title} title={item.title} detail={<>{item.message}{item.recommendation ? <span className={styles.recommendation}>{item.recommendation}</span> : null}</>} meta={`Priority ${item.score}`} variant="sage" />
      ))}</ResponsiveGrid> : <Card><h3 className="type-card-heading">A peaceful day</h3><p className="type-supporting">Nothing needs extra attention right now.</p></Card>}
    </FeatureSection>

    <FeatureSection title="Tomorrow Preview" description="Build a proposal together. Nothing is written until a parent explicitly approves it.">
      {dashboard.approvedPlan ? <Card variant="sage"><h3 className="type-card-heading">Approved plan for {dashboard.approvedPlan.planDate}</h3><ul>{dashboard.approvedPlan.items.map((item, index) => <li key={`${item.category}-${index}`}><strong>{item.category}:</strong> {item.title}</li>)}</ul></Card> : null}
      {canManage ? <PlanTomorrow /> : <p className={styles.quiet}>A parent can prepare and approve tomorrow&apos;s household plan here.</p>}
    </FeatureSection>

    <FeatureSection title="Recent Accomplishments">
      <SummaryCard title={`${dashboard.accomplishments} completed this week`} detail="Progress is acknowledged without points, pressure, or competition." variant="blush" />
    </FeatureSection>

    <FeatureSection title="Upcoming Celebrations"><MemoryList items={celebrations} canManage={canManage} /></FeatureSection>
    <FeatureSection title="Family Traditions"><MemoryList items={traditions} canManage={canManage} /></FeatureSection>
    <FeatureSection title="Household Routines"><MemoryList items={routines} canManage={canManage} /></FeatureSection>

    <FeatureSection title="Household Memory" description="Parents keep this shared context accurate. Adult-only notes remain hidden from child accounts.">
      <MemoryList items={dashboard.memories.filter((item) => !celebrations.includes(item) && !traditions.includes(item) && !routines.includes(item))} canManage={canManage} />
      {canManage ? <form action={saveHouseholdMemory} className={styles.form}>
        <label>Kind<select name="category" required>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Label<input name="label" required maxLength={120} /></label>
        <label className={styles.wide}>What should the household remember?<textarea name="value" required maxLength={2000} rows={3} /></label>
        <label>Who can see it?<select name="visibility"><option value="household">Household</option><option value="adults">Parents only</option></select></label>
        <button type="submit">Save Memory</button>
      </form> : null}
    </FeatureSection>

    <FeatureSection title="Family Preferences" description="These settings shape Kenzie&apos;s deterministic tone and which reminders may appear.">
      {canManage ? <form action={saveKenziePreferences} className={styles.form}>
        <label>Greeting style<select name="greetingStyle" defaultValue={dashboard.preferences.greetingStyle}><option value="warm">Warm</option><option value="brief">Brief</option><option value="playful">Playful</option></select></label>
        <label>Reminder style<select name="reminderStyle" defaultValue={dashboard.preferences.reminderStyle}><option value="gentle">Gentle</option><option value="direct">Direct</option><option value="minimal">Minimal</option></select></label>
        <label>Planning detail<select name="planningBehavior" defaultValue={dashboard.preferences.planningBehavior}><option value="minimal">Minimal</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
        <fieldset className={styles.wide}><legend>Reminder Preferences</legend><div className={styles.checks}>
          {["morningBriefing","eveningRecap","meals","shopping","pets","vehicles","finance","birthdays","holidays","documents"].map((name) => {
            const checked = name === "morningBriefing" ? dashboard.preferences.morningBriefing : name === "eveningRecap" ? dashboard.preferences.eveningRecap : dashboard.preferences.reminders[name];
            return <label key={name}><input type="checkbox" name={name} defaultChecked={checked} />{name.replace(/([A-Z])/g, " $1")}</label>;
          })}
        </div></fieldset>
        <button type="submit">Save Preferences</button>
      </form> : <p className={styles.quiet}>A parent manages shared Kenzie preferences.</p>}
    </FeatureSection>
  </FeaturePage>;
}
