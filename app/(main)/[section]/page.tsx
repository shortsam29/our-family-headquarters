import {notFound,redirect} from "next/navigation";
const destinations:Record<string,string>={meals:"/moms-planner",shopping:"/shopping",pets:"/family-hub/pets",contacts:"/family-hub/contacts",vehicles:"/family-hub/vehicles",documents:"/family-hub/documents",finance:"/family-hub/finances"};
export default async function LegacyRoom({params}:{params:Promise<{section:string}>}){const{section}=await params;const destination=destinations[section];if(!destination)notFound();redirect(destination)}
