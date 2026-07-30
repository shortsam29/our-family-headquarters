import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { nextRecurringDate, type CalendarRecurrence } from "@/lib/schedule/recurrence";
import { toZonedDateIso } from "@/lib/today/date";
export type ManagedTask={id:string;assignmentId:string;title:string;description?:string;category:string;scope:string;dueDate?:string;seriesStartDate?:string;dueTime?:string;priority:string;recurrence?:string;assigneeId:string;assigneeName:string;completed:boolean;archived:boolean};
export async function getManagedTasks(context:CurrentHouseholdContext):Promise<ManagedTask[]>{
 if(context.source==="development-fixture")return[]; const supabase=await createSupabaseServerClient();if(!supabase)return[];
 let query=supabase.from("task_assignments").select("id,family_member_id,assigned_by_member_id,family_members!task_assignments_family_member_id_fkey(display_name),tasks!inner(id,title,description,category,scope,due_date,due_time,priority,recurrence,active,archived_at,household_id,created_by_member_id),task_completions(id,completion_date)").eq("tasks.household_id",context.householdId);
 if(!["household_manager","parent"].includes(context.role))query=query.eq("family_member_id",context.familyMemberId);
 const {data}=await query.order("assigned_at");
 const visibleAssignments=(data??[]).filter(a=>!['household_manager','parent'].includes(context.role)||a.family_member_id===context.familyMemberId||a.assigned_by_member_id!==a.family_member_id);
 const today=toZonedDateIso(new Date(),context.timeZone);
 return visibleAssignments.map(a=>{const t=a.tasks as unknown as {id:string;title:string;description:string|null;category:string;scope:string;due_date:string|null;due_time:string|null;priority:string;recurrence:CalendarRecurrence|null;active:boolean;archived_at:string|null}; const m=a.family_members as unknown as {display_name:string};const dueDate=t.due_date&&t.recurrence?nextRecurringDate(t.due_date,t.recurrence,today):t.due_date??undefined;const completions=a.task_completions??[];return{id:t.id,assignmentId:a.id,title:t.title,description:t.description??undefined,category:t.category,scope:t.scope,dueDate,seriesStartDate:t.due_date??undefined,dueTime:t.due_time?.slice(0,5),priority:t.priority,recurrence:t.recurrence??undefined,assigneeId:a.family_member_id,assigneeName:m?.display_name??"Family member",completed:t.recurrence?completions.some(c=>c.completion_date===dueDate):Boolean(completions.length),archived:Boolean(t.archived_at)}});
}
