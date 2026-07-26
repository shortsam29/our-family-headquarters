import {DomainRoom} from "@/components/domains/DomainRoom";
import {RelatedDomainSection} from "@/components/domains/RelatedDomainSection";
import {FeaturePage,FeaturePageHeader,FeatureSection} from "@/components/features/FeaturePage";
import {requireCurrentHouseholdContext} from "@/lib/auth/context";
import {getDomainRoomData} from "@/lib/data/domains";
import {getRelatedDomainData} from "@/lib/data/related-domains";
export default async function Page(){const context=await requireCurrentHouseholdContext();const [data,related]=await Promise.all([getDomainRoomData(context,"pets"),getRelatedDomainData(context,"pets")]);const canManage=["household_manager","parent"].includes(context.role);return <FeaturePage><FeaturePageHeader eyebrow="Family Hub" title="Pets" description="Pet profiles, care reminders, vaccines, grooming, appointments, and history."/>{data.error?<p role="alert">{data.error}</p>:null}<FeatureSection title="Manage Pets"><DomainRoom slug="pets" records={data.records} canManage={canManage}/></FeatureSection>{["pets","vehicles"].includes("pets")?<FeatureSection title="Upcoming care"><RelatedDomainSection slug="pets" records={related} owners={data.records} canManage={canManage}/></FeatureSection>:null}</FeaturePage>}
