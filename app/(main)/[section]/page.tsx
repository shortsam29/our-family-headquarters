import { notFound } from "next/navigation";
import { BackToMore, FeaturePage, FeaturePageHeader, FeatureSection } from "@/components/features/FeaturePage";
import { DomainRoom } from "@/components/domains/DomainRoom";
import { RelatedDomainSection } from "@/components/domains/RelatedDomainSection";
import { secondaryDestinationBySlug, secondaryDestinations } from "@/lib/features/mock-data";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getDomainRoomData } from "@/lib/data/domains";
import { getRelatedDomainData } from "@/lib/data/related-domains";
import { isDomainSlug } from "@/types/domains";

export function generateStaticParams() { return secondaryDestinations.map(({ slug }) => ({ section: slug })); }

export default async function SecondaryRoomPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{status?:string;error?:string}> }) {
  const { section } = await params; const destination = secondaryDestinationBySlug.get(section); if (!destination) notFound();
  const context = await requireCurrentHouseholdContext();
  if (!isDomainSlug(section)) notFound();
  const [data,related,status] = await Promise.all([getDomainRoomData(context,section),getRelatedDomainData(context,section),searchParams]);
  const canManage=["household_manager","parent"].includes(context.role);
  return <FeaturePage>
    <FeaturePageHeader eyebrow={destination.eyebrow} title={destination.title} description={destination.description}/>
    {status.status?<p role="status">Your changes were saved.</p>:null}{status.error||data.error?<p role="alert">{data.error??"That change could not be saved. Please try again."}</p>:null}
    <FeatureSection title={`Manage ${destination.title.toLowerCase()}`} description="Add and update household information directly here. Kenzie can help you plan, but is never required."><DomainRoom slug={section} records={data.records} canManage={canManage}/></FeatureSection>
    {related.length||["meals","pets","vehicles"].includes(section)?<FeatureSection title={section==="meals"?"Recipes":section==="pets"?"Pet care":"Vehicle care"}><RelatedDomainSection slug={section} records={related} owners={data.records} canManage={canManage}/></FeatureSection>:null}
    <BackToMore/>
  </FeaturePage>;
}
