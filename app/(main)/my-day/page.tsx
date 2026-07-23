import { KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import TodaySectionState from "@/components/today/TodaySectionState";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import { setTaskCompletion } from "@/app/actions/tasks";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getCurrentMemberTasks, getScheduleData } from "@/lib/data/core";
import { myDayData } from "@/lib/features/mock-data";

export default async function MyDayPage() {
  const context = await requireCurrentHouseholdContext();
  const [schedule, tasks] = await Promise.all([getScheduleData(context), getCurrentMemberTasks(context)]);
  const reminders = context.source === "development-fixture" ? myDayData.reminders : { status: "empty" as const };
  const kenzie = context.source === "development-fixture" ? myDayData.kenzie : { status: "empty" as const };

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Your personal day" title="My Day" description="A focused view of what matters to the current family member—connected to the household without showing everyone else’s responsibilities." />

      <FeatureSection title="Your day at a glance">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Schedule" detail={schedule.status === "populated" ? `${schedule.data.length} relevant events` : "Nothing scheduled"} variant="sage" />
          <SummaryCard title="Tasks" detail={tasks.status === "populated" ? `${tasks.data.length} items for you` : "Your list is clear"} variant="blush" />
          <SummaryCard title="Reminders" detail={reminders.status === "populated" ? `${reminders.data.length} helpful reminder` : "Nothing urgent"} variant="neutral" />
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Your schedule" description="Only events relevant to this family member appear here.">
        <TodaySectionState state={schedule} emptyTitle="Your schedule is open" emptyMessage="There are no personal events waiting today." loadingLabel="Preparing your schedule" errorMessage="Your schedule is temporarily unavailable.">
          {(events) => <ResponsiveGrid columns={2}>{events.map((event) => <SummaryCard key={event.id} title={event.title} detail={event.allDay ? "All day" : event.startTime ?? "Time not set"} meta={event.location} />)}</ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="Your responsibilities" description="Completion is saved securely for the signed-in family member.">
        <TodayToDoCard
          state={tasks}
          onToggle={context.source === "supabase" ? setTaskCompletion : undefined}
        />
      </FeatureSection>

      <FeatureSection title="Personal reminders">
        <TodaySectionState state={reminders} emptyTitle="Nothing to remember" emptyMessage="Your reminder space is clear." loadingLabel="Checking reminders" errorMessage="Personal reminders are temporarily unavailable.">
          {(items) => <ResponsiveGrid columns={2}>{items.map((reminder) => <SummaryCard key={reminder.id} title={reminder.title} detail={reminder.when} variant="neutral" />)}</ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="A little encouragement">
        <TodaySectionState state={kenzie} emptyTitle="A quiet moment" emptyMessage="Kenzie doesn’t have a note right now." loadingLabel="Kenzie’s note is on its way" errorMessage="Kenzie’s note is unavailable. Your day still works normally.">
          {(note) => <KenzieNote title={note.title} audience={note.audience} message={note.message} signature={note.signature} />}
        </TodaySectionState>
      </FeatureSection>
    </FeaturePage>
  );
}
