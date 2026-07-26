import {DomainRoom} from "@/components/domains/DomainRoom";
import {RelatedDomainSection} from "@/components/domains/RelatedDomainSection";
import {FeaturePage,FeaturePageHeader,FeatureSection} from "@/components/features/FeaturePage";
import {requireCurrentHouseholdContext} from "@/lib/auth/context";
import {getDomainRoomData} from "@/lib/data/domains";
import {getRelatedDomainData} from "@/lib/data/related-domains";
export default async function Page(){const context=await requireCurrentHouseholdContext();const [data,related]=await Promise.all([getDomainRoomData(context,"contacts"),getRelatedDomainData(context,"contacts")]);const canManage=["household_manager","parent"].includes(context.role);return <FeaturePage><FeaturePageHeader eyebrow="Family Hub" title="Important Contacts" description="The people your family needs to reach, with simple contact details."/>{data.error?<p role="alert">{data.error}</p>:null}<FeatureSection title="Manage Important Contacts"><DomainRoom slug="contacts" records={data.records} canManage={canManage}/></FeatureSection>{["pets","vehicles"].includes("contacts")?<FeatureSection title="Upcoming care"><RelatedDomainSection slug="contacts" records={related} owners={data.records} canManage={canManage}/></FeatureSection>:null}</FeaturePage>}
