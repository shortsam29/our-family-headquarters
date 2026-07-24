import Link from "next/link";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getCurrentMemberTasks, getHouseholdMembers, getScheduleData } from "@/lib/data/core";

export default async function HouseholdPage() {
  const context = await requireCurrentHouseholdContext();
  const [members, schedule, tasks] = await Promise.all([
    getHouseholdMembers(context),
    getScheduleData(context),
    getCurrentMemberTasks(context),
  ]);

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Care for home" title="Household Care" description="A live summary of the people, plans, and responsibilities that keep this home moving." />
      <FeatureSection title={context.householdName} description={`Household time zone: ${context.timeZone}`}>
        <ResponsiveGrid columns={3}>
          <SummaryCard title="Family members" detail={members.status === "populated" ? `${members.data.length} active` : "None added"} variant="sage" />
          <SummaryCard title="Visible schedule" detail={schedule.status === "populated" ? `${schedule.data.length} events` : "No events"} variant="neutral" />
          <SummaryCard title="Your responsibilities" detail={tasks.status === "populated" ? `${tasks.data.length} tasks` : "Nothing waiting"} variant="blush" />
        </ResponsiveGrid>
      </FeatureSection>
      <FeatureSection title="Household tools">
        <ResponsiveGrid columns={3}>
          <SummaryCard title="People" detail={<Link href="/family-hub">Manage family members →</Link>} />
          <SummaryCard title="Plans" detail={<Link href="/schedule">Open the household schedule →</Link>} />
          <SummaryCard title="Preferences" detail={<Link href="/settings">Review household settings →</Link>} />
        </ResponsiveGrid>
      </FeatureSection>
    </FeaturePage>
  );
}
