import { KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import ScheduleView from "@/components/schedule/ScheduleView";
import TodaySectionState from "@/components/today/TodaySectionState";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getScheduleData } from "@/lib/data/core";

export default async function SchedulePage() {
  const context = await requireCurrentHouseholdContext();
  const state = await getScheduleData(context);
  const events = state.status === "populated" ? state.data : [];

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Household planning" title="Schedule" description="One trusted view of where the household needs to be, who is involved, and what the day holds." />

      <FeatureSection title="At a glance" description="Household commitments stay authoritative here while Today and My Day show relevant references.">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Scheduled" detail={`${events.length} visible events`} variant="sage" />
          <SummaryCard title="All-day items" detail={`${events.filter((event) => event.allDay).length} visible`} variant="neutral" />
          <SummaryCard title="Relevant to you" detail={`${events.filter((event) => event.participantIds.includes(context.familyMemberId)).length} upcoming events`} variant="blush" />
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Household calendar" description="Switch between a focused daily list and the week’s reading order.">
        <TodaySectionState state={state} emptyTitle="The schedule is open" emptyMessage="Nothing is planned, and nothing has been overlooked." loadingLabel="Preparing the schedule" errorMessage="The schedule is temporarily unavailable.">
          {(events) => <ScheduleView events={events} />}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="A helpful observation">
        <KenzieNote title="A note for the week" audience="family" message="The week has a little breathing room. The next important household event is already easy to find." />
      </FeatureSection>
    </FeaturePage>
  );
}
