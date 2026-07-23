import { FeaturePage, FeaturePageHeader, FeatureSection, ResponsiveGrid, DestinationCard } from "@/components/features/FeaturePage";
import { secondaryDestinations } from "@/lib/features/mock-data";

const groups = ["Plan & provide", "Care for home", "Protect & organize"] as const;

export default function MorePage() {
  return (
    <FeaturePage>
      <FeaturePageHeader eyebrow="More rooms in your home" title="More" description="An organized doorway to household systems that support daily life without crowding primary navigation." />
      {groups.map((group) => (
        <FeatureSection key={group} title={group}>
          <ResponsiveGrid columns={3}>
            {secondaryDestinations.filter((destination) => destination.group === group).map((destination) => (
              <DestinationCard key={destination.slug} href={`/${destination.slug}`} title={destination.title} description={destination.description} ownership={destination.ownership} />
            ))}
          </ResponsiveGrid>
        </FeatureSection>
      ))}
    </FeaturePage>
  );
}
