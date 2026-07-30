import Link from "next/link";
import { KenzieConnectionTest } from "@/components/kenzie/KenzieConnectionTest";
import { KenzieDevelopmentChat } from "@/components/kenzie/KenzieDevelopmentChat";
import { acknowledgeMemoryNotice } from "@/app/actions/kenzie-memory";
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
import { getMemorySettings } from "@/lib/kenzie/memory/service";

export default async function KenziePage() {
  const context = await requireCurrentHouseholdContext();
  const [dashboard, memorySettings] = await Promise.all([
    getKenzieDashboard(context, true),
    getMemorySettings(context),
  ]);
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
        {!memorySettings.acknowledgedAt ? (
          <Card>
            <h2>Before Kenzie starts remembering</h2>
            <p>Kenzie can automatically remember useful preferences and personal details from new conversations so future help feels more personal.</p>
            <p>You can review, edit, pause, or delete memories anytime. Kenzie will not save full conversations, passwords, financial details, precise locations, medical diagnoses, or other highly sensitive information.</p>
            <div className="button-row">
              <form action={acknowledgeMemoryNotice}><button className="button button--primary">Continue with automatic memory</button></form>
              <Link href="/settings#kenzie-memory">Review memory settings</Link>
            </div>
          </Card>
        ) : null}
        <Card><KenzieDevelopmentChat memberName={context.displayName} memoryEnabled={Boolean(memorySettings.acknowledgedAt && memorySettings.enabled)} /></Card>
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
