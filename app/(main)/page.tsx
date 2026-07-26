import Link from "next/link";
import { Card, KenzieNote } from "@/components/design-system";
import LocalDate from "@/components/today/LocalDate";
import TodayCard from "@/components/today/TodayCard";
import TodaySectionState from "@/components/today/TodaySectionState";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import { setTaskCompletion } from "@/app/actions/tasks";
import { FamilyCommunication } from "@/components/communication/FamilyCommunication";
import { QuickAdd } from "@/components/quick-add/QuickAdd";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getManagedHouseholdMembers, getScheduleData, getTodayExperienceData } from "@/lib/data/core";
import { getFamilyCommunication } from "@/lib/data/communications";
import { toZonedDateIso } from "@/lib/today/date";
import type { HouseholdPreview, SectionState } from "@/types/today";
import styles from "./page.module.css";

function HouseholdPreviewCard({ item }: { item: HouseholdPreview }) {
  return (
    <Card className={`${styles.previewCard} ${styles[`previewCard-${item.tone}`]}`}>
      <span className={styles.previewIcon} aria-hidden="true">{item.symbol}</span>
      <h2 className={styles.previewTitle}>{item.title}</h2>
      <p>{item.message}</p>
      <Link className={styles.previewLabel} href={item.id === "upcoming" ? "/household" : item.id === "grocery" ? "/grocery" : "/shopping"}>
        {item.count !== undefined ? `${item.count} ready · ` : ""}Preview →
      </Link>
    </Card>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const [todayData, scheduleState, members, communication] = await Promise.all([getTodayExperienceData(context), getScheduleData(context), getManagedHouseholdMembers(context), getFamilyCommunication(context)]);
  const todayIso = toZonedDateIso(new Date(), context.timeZone);
  const upcomingEvents = scheduleState.status === "populated" ? scheduleState.data.filter((event) => event.date > todayIso).slice(0, 5) : [];
  const canManage = ["household_manager", "parent"].includes(context.role);
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

            {feedback.status ? <p role="status">Your family headquarters was updated.</p> : null}
            {feedback.error ? <p role="alert">That item could not be saved. Please review it and try again.</p> : null}
            <div className={styles.quickAddSpacer}><QuickAdd members={members} today={todayIso} canManage={canManage} /></div>

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
                  <Link href="/kenzie" className={styles.kenzieLink}>Visit Kenzie&apos;s Desk →</Link>
                </section>
              </div>
            </section>

            <section className={styles.communicationRegion} id="family-conversations" aria-label="Family communication">
              <FamilyCommunication conversations={communication.conversations} announcements={communication.announcements} canAnnounce={canManage} />
            </section>

            <section className={styles.upcomingRegion} aria-labelledby="upcoming-events-title">
              <div className={styles.regionHeading}><h2 id="upcoming-events-title">Upcoming Events</h2><Link href="/schedule">Open calendar →</Link></div>
              {upcomingEvents.length ? <div className={styles.upcomingList}>{upcomingEvents.map((event) => <Card key={event.id}><time dateTime={event.date}>{event.date}</time><h3>{event.title}</h3><p>{event.allDay ? "All day" : event.startTime}</p></Card>)}</div> : <div className={styles.actionableEmpty}><p>No upcoming events.</p><Link href="/schedule">Add Event</Link></div>}
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
