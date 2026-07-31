import Link from "next/link";
import { KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import TodaySectionState from "@/components/today/TodaySectionState";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import { PersonalTaskForm } from "@/components/tasks/PersonalTaskForm";
import { BrainDump, PersonalWishList } from "@/components/personal/PersonalTools";
import { PlannerCollection } from "@/components/personalized/PersonalizedPlanner";
import { setTaskCompletion } from "@/app/actions/tasks";
import { completeReminder } from "@/app/actions/notifications";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getCurrentMemberTasks, getKenzieGuidance, getScheduleData } from "@/lib/data/core";
import { getDomainSignals } from "@/lib/data/domains";
import { getPrivatePersonalTools } from "@/lib/data/personal-tools";
import { canUseJasonPlanner, getPersonalizedPlannerItems } from "@/lib/data/personalized-planner";
import { toZonedDateIso } from "@/lib/today/date";
import { getMyKenzieNotes } from "@/lib/kenzie/notes/service";
import { PersonalKenzieNotes } from "@/components/kenzie/PersonalKenzieNotes";
import { getMyReminders } from "@/lib/kenzie/notifications/service";
import { resolveAuthenticatedMemberProfile } from "@/lib/kenzie/profiles/association";
import { formatScheduleDate, splitPersonalSchedule } from "@/lib/data/personal-schedule";

export default async function MyHeadquartersPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const profile = await resolveAuthenticatedMemberProfile(context);
  const canUsePlanner = canUseJasonPlanner(profile.key);
  const [schedule, tasks, signals, personalTools, plannerItems, kenzieNotes, reminders] = await Promise.all([getScheduleData(context), getCurrentMemberTasks(context), getDomainSignals(context), getPrivatePersonalTools(context), canUsePlanner ? getPersonalizedPlannerItems(context, ["training", "fight"]) : Promise.resolve([]), getMyKenzieNotes(context), getMyReminders(context)]);
  const kenzie = await getKenzieGuidance(context, schedule, tasks, signals);
  const today = toZonedDateIso(new Date(), context.timeZone);
  const personalSchedule = splitPersonalSchedule(schedule, today, context.familyMemberId);

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Your personal day" title="My Headquarters" description="Your personal safe place for today's responsibilities, private notes, and ideas you want to remember." />
      {feedback.status ? <p role="status">Your personal headquarters was updated.</p> : null}
      {feedback.error ? <p role="alert">That item could not be saved. Please check the details and try again.</p> : null}

      <FeatureSection title="Your day at a glance">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Today’s schedule" detail={personalSchedule.today.status === "populated" ? `${personalSchedule.today.data.length} ${personalSchedule.today.data.length === 1 ? "event" : "events"} today` : "Nothing scheduled today"} variant="sage" />
          <SummaryCard title="Tasks" detail={tasks.status === "populated" ? `${tasks.data.length} items for you` : "Your list is clear"} variant="blush" />
          <SummaryCard title="Reminders" detail={reminders.length ? `${reminders.length} upcoming` : "Nothing urgent"} variant="neutral" />
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Today’s schedule" description="Events scheduled for your current day appear here.">
        <TodaySectionState state={personalSchedule.today} emptyTitle="Today is open" emptyMessage="There are no personal events scheduled for today." loadingLabel="Preparing today’s schedule" errorMessage="Your schedule is temporarily unavailable.">
          {(events) => <ResponsiveGrid columns={2}>{events.map((event) => <SummaryCard key={event.id} title={event.title} detail={`${formatScheduleDate(event.date)} · ${event.allDay ? "All day" : event.startTime ?? "Time not set"}`} meta={event.location} />)}</ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="Upcoming schedule" description="Your future appointments and events appear here in date order.">
        <TodaySectionState state={personalSchedule.upcoming} emptyTitle="Nothing coming up" emptyMessage="There are no future personal events scheduled." loadingLabel="Preparing your upcoming schedule" errorMessage="Your upcoming schedule is temporarily unavailable.">
          {(events) => <ResponsiveGrid columns={2}>{events.map((event) => <SummaryCard key={event.id} title={event.title} detail={`${formatScheduleDate(event.date)} · ${event.allDay ? "All day" : event.startTime ?? "Time not set"}`} meta={event.location} />)}</ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="Your responsibilities" description="Add your own tasks here, then mark them complete when they are done.">
        <PersonalTaskForm today={today} />
        <TodayToDoCard
          state={tasks}
          onToggle={context.source === "supabase" ? setTaskCompletion : undefined}
        />
      </FeatureSection>

      <FeatureSection title="Personal reminders" description="One-time reminders addressed to your signed-in family account.">
        {reminders.length ? <ResponsiveGrid columns={2}>{reminders.map((reminder) => <div key={reminder.id}><SummaryCard title={reminder.message} detail={`${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reminder.dueAt))}${reminder.recurrence ? ` · Repeats ${reminder.recurrence}` : ""}`} variant="neutral" /><form action={completeReminder}><input type="hidden" name="reminderId" value={reminder.id}/><button type="submit">{reminder.recurrence ? "Complete this reminder" : "Mark complete"}</button></form></div>)}</ResponsiveGrid> : <p>Nothing to remember right now. Ask Kenzie to set a reminder.</p>}
      </FeatureSection>

      <FeatureSection title="Notes from Kenzie" description="Private notes addressed only to your signed-in family profile.">
        <PersonalKenzieNotes notes={kenzieNotes} />
      </FeatureSection>

      {personalTools.error ? <p role="alert">{personalTools.error}</p> : null}

      <FeatureSection title="🧠 Brain Dump" description="A place to quickly save thoughts, reminders, ideas, or anything you don’t want to forget.">
        <BrainDump notes={personalTools.brainNotes} />
      </FeatureSection>

      <FeatureSection title="⭐ Personal Wish List" description="Save things you’d like to buy someday so you don’t forget them.">
        <PersonalWishList items={personalTools.wishItems} />
      </FeatureSection>

      {canUsePlanner ? <><FeatureSection title="Upcoming Training" description="Keep firefighter training responsibilities and dates together."><PlannerCollection type="training" items={plannerItems.filter((item) => item.type === "training")} /></FeatureSection><FeatureSection title="Upcoming Fights" description="Keep buhurt events, travel dates, and locations together."><PlannerCollection type="fight" items={plannerItems.filter((item) => item.type === "fight")} /></FeatureSection></> : null}

      <FeatureSection title="A little encouragement">
        <TodaySectionState state={kenzie} emptyTitle="A quiet moment" emptyMessage="Kenzie doesn’t have a note right now." loadingLabel="Kenzie’s note is on its way" errorMessage="Kenzie’s note is unavailable. Your day still works normally.">
          {(note) => <KenzieNote title={note.title} audience={note.audience} message={note.message} signature={note.signature} />}
        </TodaySectionState>
      </FeatureSection>
    <FeatureSection title="Talk with Kenzie"><p><Link href="/kenzie">Talk with Kenzie →</Link></p></FeatureSection>
    </FeaturePage>
  );
}
