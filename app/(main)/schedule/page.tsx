import { KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import ScheduleView from "@/components/schedule/ScheduleView";
import TodaySectionState from "@/components/today/TodaySectionState";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getManagedHouseholdMembers, getScheduleData } from "@/lib/data/core";
import { toZonedDateIso } from "@/lib/today/date";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string; date?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const [state,members] = await Promise.all([getScheduleData(context),getManagedHouseholdMembers(context)]);
  const events = state.status === "populated" ? state.data : [];
  const today=toZonedDateIso(new Date(),context.timeZone);
  const thirtyDaysOut = new Date(`${today}T12:00:00`);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const through = toZonedDateIso(thirtyDaysOut, "UTC");
  const canManage=["household_manager","parent"].includes(context.role);
  const initialDate=/^\d{4}-\d{2}-\d{2}$/.test(feedback.date??"")?feedback.date:undefined;
  return <FeaturePage>
    <FeaturePageHeader eyebrow="Household calendar" title="Schedule" description="Plan family time directly, then see the same trusted events in Today, My Day, and Kenzie." />
    {feedback.status ? <p role="status">The event was saved and is now on the household calendar.</p> : null}
    {feedback.error ? <p role="alert">That event could not be saved. Add a title, date, and start time, then try again.</p> : null}
    <FeatureSection title="At a glance"><ResponsiveGrid columns={3}><SummaryCard title="Today" detail={`${events.filter(e=>e.date===today).length} events`} variant="sage"/><SummaryCard title="Next 30 days" detail={`${events.filter(e=>e.date>today&&e.date<=through).length} events`} variant="neutral"/><SummaryCard title="Your event series" detail={`${new Set(events.filter(e=>e.participantIds.includes(context.familyMemberId)).map(e=>e.seriesId??e.id)).size} visible`} variant="blush"/></ResponsiveGrid></FeatureSection>
    <FeatureSection title="Household calendar" description={canManage?"Choose any date or view, or add an event directly.":"Choose any date or view. A parent or household manager manages events."}>
      <TodaySectionState state={state} emptyTitle="No upcoming events" emptyMessage="The calendar is open. Add an event when the family is ready." loadingLabel="Preparing the calendar" errorMessage="The calendar is temporarily unavailable.">
        {()=> <ScheduleView events={events} members={members} canManage={canManage} today={today} initialDate={initialDate}/>}
      </TodaySectionState>
      {state.status==="empty" ? <ScheduleView events={[]} members={members} canManage={canManage} today={today}/> : null}
    </FeatureSection>
    <FeatureSection title="A helpful observation"><KenzieNote title="A note for the week" audience="family" message="Your calendar stays yours. I’ll use it to point out useful timing and conflicts, but I won’t change it without your approval." /></FeatureSection>
  </FeaturePage>;
}
