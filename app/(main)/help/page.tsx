import { Card, KenzieNote } from "@/components/design-system";
import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";

export const metadata = { title: "Help & About" };

export default function HelpPage() {
  return <FeaturePage>
    <FeaturePageHeader eyebrow="Help & About" title="A little help around the house" description="Clear answers about this family home, Kenzie, privacy, permissions, and the Family Vault." />
    <FeatureSection title="About Our Family Headquarters">
      <Card><p>Our Family Headquarters brings schedules, responsibilities, meals, household records, and everyday family plans into one calm shared home. It is designed for family life—not workplace productivity.</p></Card>
    </FeatureSection>
    <FeatureSection title="About Kenzie">
      <KenzieNote title="A supportive household presence" audience="family" message="Kenzie notices useful patterns, prepares gentle recommendations, and helps the family plan. She never changes household information without explicit approval." />
    </FeatureSection>
    <FeatureSection title="Privacy and permissions">
      <ResponsiveGrid columns={3}>
        <SummaryCard title="One household" detail="Every protected record is scoped to the signed-in member’s verified household." variant="sage" />
        <SummaryCard title="Different roles" detail="Parents and household managers can manage sensitive areas. Children see only information permitted for their role." variant="blush" />
        <SummaryCard title="Private by default" detail="Finance, adult-only memories, and protected Vault records are enforced by database policies—not merely hidden in the interface." variant="neutral" />
      </ResponsiveGrid>
    </FeatureSection>
    <FeatureSection title="Where documents are stored">
      <Card><p>Family Vault files are stored in the household’s private Supabase Storage bucket. Signed links are short-lived, file metadata stays household-scoped, and access follows the document’s visibility setting.</p></Card>
    </FeatureSection>
    <FeatureSection title="Support and version">
      <Card><h3 className="type-card-heading">Version 1.0</h3><p className="type-supporting">For help with a household account, contact the person who manages your household. For technical maintenance, use the project repository and the owner launch guide.</p></Card>
    </FeatureSection>
  </FeaturePage>;
}
