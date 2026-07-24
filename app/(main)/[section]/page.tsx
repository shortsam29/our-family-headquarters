import { notFound } from "next/navigation";
import { EmptyState } from "@/components/design-system";
import { BackToMore, FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, SummaryCard } from "@/components/features/FeaturePage";
import { secondaryDestinationBySlug, secondaryDestinations } from "@/lib/features/mock-data";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";

export function generateStaticParams() {
  return secondaryDestinations.map(({ slug }) => ({ section: slug }));
}

export default async function SecondaryOverviewPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const destination = secondaryDestinationBySlug.get(section);
  if (!destination) notFound();
  const context = await requireCurrentHouseholdContext();

  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow={destination.eyebrow} title={destination.title} description={destination.description} />

      <FeatureSection title="Current information">
        {context.source === "development-fixture" ? (
          <ResponsiveGrid columns={3}>
            {destination.highlights.map((highlight, index) => (
              <SummaryCard key={highlight.title} title={highlight.title} detail={highlight.detail} variant={index === 0 ? "sage" : index === 1 ? "blush" : "neutral"} />
            ))}
          </ResponsiveGrid>
        ) : (
          <EmptyState title={`${destination.title} is ready for setup`} description={destination.emptyMessage} />
        )}
      </FeatureSection>

      <FeatureSection title="Ownership and access">
        <SummaryCard title="Source of truth" detail={destination.ownership} />
      </FeatureSection>

      <BackToMore />
    </FeaturePage>
  );
}
