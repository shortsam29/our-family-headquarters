import {redirect} from "next/navigation";
import {DomainRoom} from "@/components/domains/DomainRoom";
import {FeaturePage,FeaturePageHeader,FeatureSection} from "@/components/features/FeaturePage";
import {PlanTomorrow} from "@/components/kenzie/PlanTomorrow";
import {TaskManager} from "@/components/tasks/TaskManager";
import {requireCurrentHouseholdContext} from "@/lib/auth/context";
import {getManagedHouseholdMembers} from "@/lib/data/core";
import {getDomainRoomData} from "@/lib/data/domains";
import {getManagedTasks} from "@/lib/data/tasks";
import {toZonedDateIso} from "@/lib/today/date";
export default async function MomsPlanner(){const context=await requireCurrentHouseholdContext();if(!context.displayName.trim().toLowerCase().startsWith("samantha"))redirect("/my-headquarters");const[tasks,members,meals]=await Promise.all([getManagedTasks(context),getManagedHouseholdMembers(context),getDomainRoomData(context,"meals")]);const today=toZonedDateIso(new Date(),context.timeZone);return <FeaturePage><FeaturePageHeader eyebrow="Private planning space" title="Mom's Planner" description="Weekly planning, meals, chores, and a calm look ahead with Kenzie."/><FeatureSection title="Weekly chores and homework"><TaskManager tasks={tasks} members={members} canManage today={today} currentMemberId={context.familyMemberId}/></FeatureSection><FeatureSection title="Weekly meal planning"><DomainRoom slug="meals" records={meals.records} canManage/></FeatureSection><FeatureSection title="Plan with Kenzie" description="Review a structured proposal. Nothing saves until you approve it."><PlanTomorrow/></FeatureSection></FeaturePage>}
