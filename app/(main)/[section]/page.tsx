import { notFound } from "next/navigation";
import { Badge } from "@/components/design-system";
import { BackToMore, FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { secondaryDestinationBySlug, secondaryDestinations } from "@/lib/features/mock-data";

export function generateStaticParams() {
  return secondaryDestinations.map(({ slug }) => ({ section: slug }));
}

export default async function SecondaryOverviewPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const destination = secondaryDestinationBySlug.get(section);
  if (!destination) notFound();

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow={destination.eyebrow} title={destination.title} description={destination.description} />

      <FeatureSection title="Overview" description="Realistic frontend content demonstrates the approved information boundary without pretending persistence or integrations are active.">
        <ResponsiveGrid columns={3}>
          {destination.highlights.map((highlight, index) => (
            <SummaryCard key={highlight.title} title={highlight.title} detail={highlight.detail} variant={index === 0 ? "sage" : index === 1 ? "blush" : "neutral"} />
          ))}
        </ResponsiveGrid>
      </FeatureSection>

      <FeatureSection title="Ownership and access">
        <SummaryCard title="Source of truth" detail={destination.ownership} meta="Frontend preview · future permission enforcement required" />
      </FeatureSection>

      <FeatureSection title="Current availability">
        <Badge variant="sage">Frontend overview available</Badge>
        <p className="type-supporting">Editing, uploads, external synchronization, and persistent actions are intentionally deferred. No controls on this page imply that those operations are active.</p>
      </FeatureSection>

      <BackToMore />
    </FeaturePage>
  );
}
