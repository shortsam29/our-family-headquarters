import Link from "next/link";
import { Badge, Card, FamilyMemberBadge, KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import TodaySectionState from "@/components/today/TodaySectionState";
import { familyHubUpdates, familyMembers, householdAssets } from "@/lib/features/mock-data";

export default function FamilyHubPage() {
  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Family communication" title="Family Hub" description="A warm, permission-aware home for household conversations, announcements, and the people who share this home." />

      <FeatureSection title="Household members" description="Neutral development profiles demonstrate the shared-home model without using real family information.">
        <ResponsiveGrid columns={3}>
          {familyMembers.map((member) => (
            <Card key={member.id}>
              <FamilyMemberBadge initials={member.initials} name={member.displayName} detail={member.relationship} />
              <p className="type-supporting">{member.nextRelevantItem}</p>
              {member.birthdayLabel ? <Badge variant="rose">{member.birthdayLabel}</Badge> : null}
            </Card>
          ))}
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Family updates" description="Announcements inform; conversations remain collaborative and keep their own history.">
        <TodaySectionState state={{ status: "populated", data: familyHubUpdates }} emptyTitle="The family inbox is clear" emptyMessage="There are no announcements or conversations waiting." loadingLabel="Gathering family updates" errorMessage="Family updates are temporarily unavailable.">
          {(updates) => (
            <ResponsiveGrid columns={2}>
              {updates.map((update) => <SummaryCard key={update.id} title={update.title} detail={update.message} meta={`${update.type} · ${update.audience}`} variant={update.type === "announcement" ? "blush" : "sage"} />)}
            </ResponsiveGrid>
          )}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="People and household care" description="People remain distinct from protected household assets and records.">
        <ResponsiveGrid columns={3}>
          {householdAssets.map((asset) => (
            <Card key={asset.id}>
              <h3 className="type-card-heading">{asset.name}</h3>
              <p className="type-supporting">{asset.summary}</p>
              <Badge>{asset.access === "adults" ? "Adult access" : "Household view"}</Badge>
              <p><Link href={`/${asset.kind === "pet" ? "pets" : asset.kind === "vehicle" ? "vehicles" : "contacts"}`}>Open overview →</Link></p>
            </Card>
          ))}
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Kenzie’s reminder">
        <KenzieNote title="For the household" audience="family" message="Important updates have one place to land. Everyone can stay informed without one person repeating everything." />
      </FeatureSection>
    </FeaturePage>
  );
}
