import Link from "next/link";
import { KenzieConnectionTest } from "@/components/kenzie/KenzieConnectionTest";
import { KenzieDevelopmentChat } from "@/components/kenzie/KenzieDevelopmentChat";
import { Card, KenzieNote } from "@/components/design-system";
import {
  FeaturePage,
  FeaturePageHeader,
  FeatureSection,
  ResponsiveGrid,
  SummaryCard,
} from "@/components/features/FeaturePage";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getKenzieDashboard } from "@/lib/data/kenzie-dashboard";

export default async function KenziePage() {
  const context = await requireCurrentHouseholdContext();
  const dashboard = await getKenzieDashboard(context, true);
  const development = process.env.NODE_ENV !== "production";
  return (
    <FeaturePage>
      <FeaturePageHeader
        eyebrow="A member of the family"
        title="Kenzie"
        description="Ask Kenzie a general question, get authorized household help, or plan for tomorrow."
      />
      <FeatureSection
        title="Talk with Kenzie"
        description="One private conversation for general questions and relevant household help. Conversations are not saved as memory."
      >
        <Card><KenzieDevelopmentChat memberName={context.displayName} /></Card>
      </FeatureSection>
      {development && context.role === "household_manager" ? (
        <FeatureSection
          title="Secure AI connection test"
          description="A private development check that sends no household or personal information."
        >
          <Card><KenzieConnectionTest /></Card>
        </FeatureSection>
      ) : null}
      <FeatureSection title="Today’s Briefing">
        <KenzieNote
          title={dashboard.note.title}
          audience={dashboard.note.audience}
          message={dashboard.note.message}
          signature={dashboard.note.signature}
        />
      </FeatureSection>
      <FeatureSection title="Things To Know">
        {dashboard.observations.length ? (
          <ResponsiveGrid columns={2}>
            {dashboard.observations.map((item) => (
              <SummaryCard key={item.title} title={item.title} detail={item.message} meta={item.recommendation} />
            ))}
          </ResponsiveGrid>
        ) : <p>Nothing needs extra attention right now.</p>}
      </FeatureSection>
      <FeatureSection title="Plan Tomorrow">
        <p><Link href="/kenzie/plan-tomorrow">Open Plan Tomorrow →</Link></p>
      </FeatureSection>
    </FeaturePage>
  );
}
