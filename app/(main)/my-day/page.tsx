import { KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import TodaySectionState from "@/components/today/TodaySectionState";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import { myDayData } from "@/lib/features/mock-data";

export default function MyDayPage() {
  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Your personal day" title="My Day" description="A focused view of what matters to the current family member—connected to the household without showing everyone else’s responsibilities." />

      <FeatureSection title="Your day at a glance">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Schedule" detail={myDayData.schedule.status === "populated" ? `${myDayData.schedule.data.length} relevant events` : "Checking today"} variant="sage" />
          <SummaryCard title="Tasks" detail={myDayData.tasks.status === "populated" ? `${myDayData.tasks.data.length} items for you` : "Checking your list"} variant="blush" />
          <SummaryCard title="Reminders" detail={myDayData.reminders.status === "populated" ? `${myDayData.reminders.data.length} helpful reminder` : "Nothing urgent"} variant="neutral" />
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Your schedule" description="Only events relevant to this family member appear here.">
        <TodaySectionState state={myDayData.schedule} emptyTitle="Your schedule is open" emptyMessage="There are no personal events waiting today." loadingLabel="Preparing your schedule" errorMessage="Your schedule is temporarily unavailable.">
          {(events) => <ResponsiveGrid columns={2}>{events.map((event) => <SummaryCard key={event.id} title={event.title} detail={event.allDay ? "All day" : event.startTime ?? "Time not set"} meta={event.location} />)}</ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="Your responsibilities" description="Completion is session-only until the future permission-aware persistence service is connected.">
        <TodayToDoCard state={myDayData.tasks} />
      </FeatureSection>

      <FeatureSection title="Personal reminders">
        <TodaySectionState state={myDayData.reminders} emptyTitle="Nothing to remember" emptyMessage="Your reminder space is clear." loadingLabel="Checking reminders" errorMessage="Personal reminders are temporarily unavailable.">
          {(reminders) => <ResponsiveGrid columns={2}>{reminders.map((reminder) => <SummaryCard key={reminder.id} title={reminder.title} detail={reminder.when} variant="neutral" />)}</ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="A little encouragement">
        <TodaySectionState state={myDayData.kenzie} emptyTitle="A quiet moment" emptyMessage="Kenzie doesn’t have a note right now." loadingLabel="Kenzie’s note is on its way" errorMessage="Kenzie’s note is unavailable. Your day still works normally.">
          {(note) => <KenzieNote title={note.title} audience={note.audience} message={note.message} signature={note.signature} />}
        </TodaySectionState>
      </FeatureSection>
    </FeaturePage>
  );
}
