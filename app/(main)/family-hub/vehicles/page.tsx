import {DomainRoom} from "@/components/domains/DomainRoom";
import {RelatedDomainSection} from "@/components/domains/RelatedDomainSection";
import {FeaturePage,FeaturePageHeader,FeatureSection} from "@/components/features/FeaturePage";
import {requireCurrentHouseholdContext} from "@/lib/auth/context";
import {getDomainRoomData} from "@/lib/data/domains";
import {getRelatedDomainData} from "@/lib/data/related-domains";
export default async function Page(){const context=await requireCurrentHouseholdContext();const [data,related]=await Promise.all([getDomainRoomData(context,"vehicles"),getRelatedDomainData(context,"vehicles")]);const canManage=["household_manager","parent"].includes(context.role);return <FeaturePage><FeaturePageHeader eyebrow="Family Hub" title="Vehicles & Maintenance" description="Household vehicles, renewals, and care reminders."/>{data.error?<p role="alert">{data.error}</p>:null}<FeatureSection title="Manage Vehicles & Maintenance"><DomainRoom slug="vehicles" records={data.records} canManage={canManage}/></FeatureSection>{["pets","vehicles"].includes("vehicles")?<FeatureSection title="Upcoming care"><RelatedDomainSection slug="vehicles" records={related} owners={data.records} canManage={canManage}/></FeatureSection>:null}</FeaturePage>}
