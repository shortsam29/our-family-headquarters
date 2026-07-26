import Link from "next/link";
import { Badge, Card, FamilyMemberBadge, KenzieNote } from "@/components/design-system";
import { FamilyMemberManager } from "@/components/family/FamilyMemberManager";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid } from "@/components/features/FeaturePage";
import TodaySectionState from "@/components/today/TodaySectionState";
import { householdAssets } from "@/lib/features/mock-data";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getHouseholdInvitations, getHouseholdMembers, getManagedHouseholdMembers } from "@/lib/data/core";
import { getHouseholdAssetSummaries } from "@/lib/data/household-assets";

export default async function FamilyHubPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const feedback = await searchParams;
  const [membersState, managedMembers, invitations, liveAssets] = await Promise.all([getHouseholdMembers(context), getManagedHouseholdMembers(context), getHouseholdInvitations(context), getHouseholdAssetSummaries(context)]);
  const canManageMembers = context.role === "household_manager" || context.role === "parent";
  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="Family communication" title="Family Hub" description="A warm, permission-aware home for household conversations, announcements, and the people who share this home." />

      {feedback.status ? <p role="status">Family member information saved.</p> : null}
      {feedback.error ? <p role="alert">That family member change could not be saved. Please review it and try again.</p> : null}

      <FeatureSection title="Household members" description="The people who belong to this household and their shared-home roles.">
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

      {canManageMembers ? (
        <FeatureSection title="Manage family members" description="Add family profiles, create secure join codes, and manage household access.">
          <FamilyMemberManager members={managedMembers} currentMemberId={context.familyMemberId} invitations={invitations} />
        </FeatureSection>
      ) : null}

      <FeatureSection title="Family conversations and announcements" description="Quick messages and important notices now live at the heart of the home.">
        <Card><p><Link href="/#family-conversations">Open family communication on Family Headquarters →</Link></p></Card>
      </FeatureSection>

      <FeatureSection title="People and household care" description="People remain distinct from protected household assets and records.">
        <TodaySectionState state={context.source === "development-fixture" ? { status: "populated", data: householdAssets } : liveAssets.length ? { status: "populated", data: liveAssets } : { status: "empty" }} emptyTitle="Household care is ready for setup" emptyMessage="No household assets have been added yet." loadingLabel="Gathering household care" errorMessage="Household care is temporarily unavailable.">
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
