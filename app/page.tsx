import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Card, KenzieNote } from "@/components/design-system";
import TodayCard from "@/components/today/TodayCard";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import styles from "./page.module.css";

const scheduleItems = [
  { time: "Morning", label: "A gentle start to the day" },
  { time: "Afternoon", label: "Family plans will appear here" },
  { time: "Evening", label: "Time together at home" },
];

const previewCards = [
  { title: "Shopping List", message: "Shared household items.", tone: "sage", symbol: "S" },
  { title: "Grocery List", message: "The next grocery list will be easy to find.", tone: "blush", symbol: "G" },
  { title: "Family Inbox", message: "Family requests will have one calm place.", tone: "blue", symbol: "F" },
  { title: "Coming Up", message: "A few helpful reminders for the week.", tone: "taupe", symbol: "C" },
];

export default function Home() {
  return (
    <>
      <Header />
      <div className={styles.applicationShell}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.todayPage}>
            <header className={styles.welcome}>
              <p className={styles.todayLabel}>Today</p>
              <p className={styles.calendarDate}>Tuesday, July 22, 2026</p>
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
                  <ul className={styles.scheduleList}>
                    {scheduleItems.map((item) => <li key={item.time}><span>{item.time}</span><p>{item.label}</p></li>)}
                  </ul>
                </TodayCard>
                <TodayCard title="72°" eyebrow="Right now" variant="sage" className={styles.weatherCard}>
                  <div className={styles.weatherIcon} aria-hidden="true">☁</div>
                  <p className={styles.weatherCondition}>Partly Cloudy</p>
                  <small>Feels like 73°</small>
                  <p className={styles.weatherMessage}>Beautiful day ahead.</p>
                </TodayCard>
                <TodayCard title="Spaghetti & Meatballs" eyebrow="Dinner tonight" variant="blush" className={styles.dinnerCard}>
                  <p className={styles.featureText}>With garlic bread<br />and green salad</p>
                  <div className={styles.dinnerMark} aria-hidden="true">♨</div>
                </TodayCard>
              </div>

              <div className={styles.dailyLifeGrid}>
                <TodayToDoCard />
                <section className={styles.kenzieSection} aria-labelledby="kenzie-heading">
                  <h2 id="kenzie-heading" className={styles.visuallyHidden}>Kenzie&apos;s daily note</h2>
                  <KenzieNote title="A note from Kenzie" audience="family" message="Your day has a place to land. We’ll keep it simple and take it one step at a time." />
                </section>
              </div>
            </section>

            <section className={styles.supportingRegion} id="family-hub" aria-label="Supporting household information">
              <div className={styles.previewGrid}>
                {previewCards.map((item) => (
                  <Card key={item.title} className={`${styles.previewCard} ${styles[`previewCard-${item.tone}`]}`}>
                    <span className={styles.previewIcon} aria-hidden="true">{item.symbol}</span>
                    <h2 className={styles.previewTitle}>{item.title}</h2>
                    <p>{item.message}</p>
                    <span className={styles.previewLabel}>Preview →</span>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
