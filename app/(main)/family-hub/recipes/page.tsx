import {RelatedDomainSection} from "@/components/domains/RelatedDomainSection";
import {FeaturePage,FeaturePageHeader,FeatureSection} from "@/components/features/FeaturePage";
import {requireCurrentHouseholdContext} from "@/lib/auth/context";
import {getRelatedDomainData} from "@/lib/data/related-domains";
export default async function Page(){const context=await requireCurrentHouseholdContext();const recipes=await getRelatedDomainData(context,"meals");const canManage=["household_manager","parent"].includes(context.role);return <FeaturePage><FeaturePageHeader eyebrow="Family Hub" title="Recipes" description="The meals your family returns to, with ingredients and instructions kept together."/><FeatureSection title="Family recipes"><RelatedDomainSection slug="meals" records={recipes} owners={[]} canManage={canManage}/></FeatureSection></FeaturePage>}
