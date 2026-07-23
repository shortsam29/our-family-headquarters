import Link from "next/link";
import { Badge, Card, FamilyMemberBadge, KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import TodaySectionState from "@/components/today/TodaySectionState";
import { familyHubUpdates, householdAssets } from "@/lib/features/mock-data";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getHouseholdMembers } from "@/lib/data/core";

export default async function FamilyHubPage() {
  const context = await requireCurrentHouseholdContext();
  const membersState = await getHouseholdMembers(context);
  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Family communication" title="Family Hub" description="A warm, permission-aware home for household conversations, announcements, and the people who share this home." />

      <FeatureSection title="Household members" description="Neutral development profiles demonstrate the shared-home model without using real family information.">
        <TodaySectionState state={membersState} emptyTitle="Household setup is ready" emptyMessage="No family-member profiles have been added yet." loadingLabel="Gathering household members" errorMessage="Household members are temporarily unavailable.">
          {(members) => <ResponsiveGrid columns={3}>
            {members.map((member) => (
              <Card key={member.id}>
                <FamilyMemberBadge initials={member.initials} name={member.displayName} detail={member.relationship} />
                {member.nextRelevantItem ? <p className="type-supporting">{member.nextRelevantItem}</p> : null}
                {member.birthdayLabel ? <Badge variant="rose">{member.birthdayLabel}</Badge> : null}
              </Card>
            ))}
          </ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="Family updates" description="Announcements inform; conversations remain collaborative and keep their own history.">
        <TodaySectionState state={context.source === "development-fixture" ? { status: "populated", data: familyHubUpdates } : { status: "empty" }} emptyTitle="The family inbox is clear" emptyMessage="There are no announcements or conversations waiting." loadingLabel="Gathering family updates" errorMessage="Family updates are temporarily unavailable.">
          {(updates) => (
            <ResponsiveGrid columns={2}>
              {updates.map((update) => <SummaryCard key={update.id} title={update.title} detail={update.message} meta={`${update.type} · ${update.audience}`} variant={update.type === "announcement" ? "blush" : "sage"} />)}
            </ResponsiveGrid>
          )}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="People and household care" description="People remain distinct from protected household assets and records.">
        <TodaySectionState state={context.source === "development-fixture" ? { status: "populated", data: householdAssets } : { status: "empty" }} emptyTitle="Household care is ready for setup" emptyMessage="No household assets have been added yet." loadingLabel="Gathering household care" errorMessage="Household care is temporarily unavailable.">
          {(assets) => <ResponsiveGrid columns={3}>
            {assets.map((asset) => (
              <Card key={asset.id}>
                <h3 className="type-card-heading">{asset.name}</h3>
                <p className="type-supporting">{asset.summary}</p>
                <Badge>{asset.access === "adults" ? "Adult access" : "Household view"}</Badge>
                <p><Link href={`/${asset.kind === "pet" ? "pets" : asset.kind === "vehicle" ? "vehicles" : "contacts"}`}>Open overview →</Link></p>
              </Card>
            ))}
          </ResponsiveGrid>}
        </TodaySectionState>
      </FeatureSection>

      <FeatureSection title="Kenzie’s reminder">
        <KenzieNote title="For the household" audience="family" message="Important updates have one place to land. Everyone can stay informed without one person repeating everything." />
      </FeatureSection>
    </FeaturePage>
  );
}
