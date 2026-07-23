import { Card, KenzieNote } from "@/components/design-system";
import LocalDate from "@/components/today/LocalDate";
import TodayCard from "@/components/today/TodayCard";
import TodaySectionState from "@/components/today/TodaySectionState";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import { setTaskCompletion } from "@/app/actions/tasks";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getTodayExperienceData } from "@/lib/data/core";
import type { HouseholdPreview, SectionState } from "@/types/today";
import styles from "./page.module.css";

function HouseholdPreviewCard({ item }: { item: HouseholdPreview }) {
  return (
    <Card className={`${styles.previewCard} ${styles[`previewCard-${item.tone}`]}`}>
      <span className={styles.previewIcon} aria-hidden="true">{item.symbol}</span>
      <h2 className={styles.previewTitle}>{item.title}</h2>
      <p>{item.message}</p>
      <span className={styles.previewLabel}>
        {item.count !== undefined ? `${item.count} ready · ` : ""}Preview →
      </span>
    </Card>
  );
}

export default async function Home() {
  const context = await requireCurrentHouseholdContext();
  const todayData = await getTodayExperienceData(context);
  const householdPreviews: SectionState<HouseholdPreview>[] = [
    todayData.shopping,
    todayData.grocery,
    todayData.inbox,
    todayData.upcoming,
  ];
  return (
    <main className={styles.mainContent}>
          <div className={styles.todayPage}>
            <header className={styles.welcome}>
              <p className={styles.todayLabel}>Today</p>
              <LocalDate className={styles.calendarDate} />
              <div className={styles.miniSprig} aria-hidden="true"><i /><i /><span /></div>
              <h1 className={styles.welcomeTitle}>
                Welcome home
                <span className={styles.welcomeHeart} aria-hidden="true">♡</span>
              </h1>
              <p className={styles.welcomeMessage}>Everything your family needs for today will come together here.</p>
              <div className={styles.botanicalDivider} aria-hidden="true"><span>♥</span></div>
            </header>

            <section className={styles.dashboardRegion} aria-label="Today’s dashboard">
              <div className={styles.primaryGrid}>
                <TodayCard title="Today’s Schedule" eyebrow="Today’s schedule" className={styles.scheduleCard}>
                  <TodaySectionState
                    state={todayData.schedule}
                    emptyTitle="No events today"
                    emptyMessage="The day is beautifully open. Nothing has been overlooked."
                    loadingLabel="Checking today’s schedule"
                    errorMessage="The schedule is temporarily unavailable."
                  >
                    {(items) => (
                      <ul className={styles.scheduleList}>
                        {items.map((item) => <li key={item.id}><span>{item.daypart}</span><p>{item.title}</p></li>)}
                      </ul>
                    )}
                  </TodaySectionState>
                </TodayCard>
                <TodayCard title="Weather" eyebrow="Right now" variant="sage" className={styles.weatherCard}>
                  <TodaySectionState
                    state={todayData.weather}
                    emptyTitle="Weather is quiet"
                    emptyMessage="There’s no weather summary to show yet."
                    loadingLabel="Checking the weather"
                    errorMessage="Weather is unavailable, but the rest of today is ready."
                  >
                    {(weather) => (
                      <>
                        <p className={styles.weatherTemperature}>{weather.temperature}°</p>
                        <div className={styles.weatherIcon} aria-hidden="true">☁</div>
                        <p className={styles.weatherCondition}>{weather.condition}</p>
                        <small>Feels like {weather.feelsLike}°</small>
                        <p className={styles.weatherMessage}>{weather.message}</p>
                      </>
                    )}
                  </TodaySectionState>
                </TodayCard>
                <TodayCard title="Dinner Tonight" eyebrow="Dinner tonight" variant="blush" className={styles.dinnerCard}>
                  <TodaySectionState
                    state={todayData.dinner}
                    emptyTitle="Dinner is open"
                    emptyMessage="There’s still plenty of time to choose something simple."
                    loadingLabel="Checking tonight’s plan"
                    errorMessage="Dinner details are temporarily unavailable."
                  >
                    {(dinner) => (
                      <>
                        <h3 className={styles.dinnerTitle}>{dinner.name}</h3>
                        {dinner.details ? <p className={styles.featureText}>{dinner.details}</p> : null}
                        <div className={styles.dinnerMark} aria-hidden="true">♨</div>
                      </>
                    )}
                  </TodaySectionState>
                </TodayCard>
              </div>

              <div className={styles.dailyLifeGrid}>
                <TodayToDoCard
                  state={todayData.tasks}
                  onToggle={context.source === "supabase" ? setTaskCompletion : undefined}
                />
                <section className={styles.kenzieSection} aria-labelledby="kenzie-heading">
                  <h2 id="kenzie-heading" className={styles.visuallyHidden}>Kenzie&apos;s daily note</h2>
                  <TodaySectionState
                    state={todayData.kenzie}
                    emptyTitle="A quiet moment"
                    emptyMessage="Kenzie doesn’t have a note for today, and everything else is still here."
                    loadingLabel="Kenzie’s note is on its way"
                    errorMessage="Kenzie’s note is unavailable. Your household information still works normally."
                  >
                    {(note) => (
                      <KenzieNote
                        title={note.title}
                        audience={note.audience}
                        message={note.message}
                        signature={note.signature}
                      />
                    )}
                  </TodaySectionState>
                </section>
              </div>
            </section>

            <section className={styles.supportingRegion} id="family-hub" aria-label="Supporting household information">
              <div className={styles.previewGrid}>
                {householdPreviews.map((previewState, index) => (
                  <TodaySectionState
                    key={index}
                    state={previewState}
                    emptyTitle="Nothing waiting"
                    emptyMessage="This area is clear for now."
                    loadingLabel="Getting this preview ready"
                    errorMessage="This preview is temporarily unavailable."
                  >
                    {(item) => <HouseholdPreviewCard item={item} />}
                  </TodaySectionState>
                ))}
              </div>
            </section>
          </div>
    </main>
  );
}
