import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { householdLocalDateTimeToIso } from "@/lib/schedule/event-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toZonedDateIso } from "@/lib/today/date";

export const kenzieActionProposalSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_calendar_event"),
    title: z.string().trim().min(1).max(160),
    date: z.iso.date(),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  z.object({
    kind: z.literal("create_note"),
    recipientSearch: z.string().trim().min(1).max(120),
    recipientLabel: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(4000),
  }),
  z.object({
    kind: z.literal("create_reminder"),
    recipientSearch: z.string().trim().min(1).max(120),
    recipientLabel: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(500),
    date: z.iso.date(),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  z.object({
    kind: z.literal("save_meal"),
    name: z.string().trim().min(1).max(160),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    date: z.iso.date(),
  }),
]);
export type KenzieActionProposal = z.infer<typeof kenzieActionProposalSchema>;
export type KenzieActionResponse = {
  message: string;
  status: "proposal" | "clarification" | "completed" | "failed";
  proposal?: KenzieActionProposal;
};

type DetectedAction =
  | KenzieActionProposal
  | { kind: "add_shopping_item"; name: string; listType: "grocery" | "household" }
  | { kind: "complete_own_chore"; title: string }
  | { kind: "create_note_request"; recipientSearch: string; message: string }
  | { kind: "create_reminder_request"; recipientSearch: string; message: string; date: string; time: string }
  | { kind: "clarification"; message: string };

function isoDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function resolveDatePhrase(raw: string, now: Date) {
  const phrase = raw.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(phrase)) return phrase;
  const value = new Date(now);
  value.setHours(12, 0, 0, 0);
  if (phrase === "today") return isoDate(value);
  if (phrase === "tomorrow") {
    value.setDate(value.getDate() + 1);
    return isoDate(value);
  }
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = weekdays.findIndex((day) => phrase === day || phrase === `next ${day}`);
  if (target < 0) return null;
  let distance = (target - value.getDay() + 7) % 7;
  if (distance === 0 || phrase.startsWith("next ")) distance += 7;
  value.setDate(value.getDate() + distance);
  return isoDate(value);
}

function resolveTimePhrase(raw: string) {
  const phrase = raw.trim().toLowerCase().replace(/\./g, "");
  const named = { morning: "09:00", noon: "12:00", afternoon: "15:00", evening: "19:00" } as const;
  if (phrase in named) return named[phrase as keyof typeof named];
  const match = phrase.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour > 23 || minute > 59 || (match[3] && (hour < 1 || hour > 12))) return null;
  if (!match[3] && hour >= 1 && hour <= 7) hour += 12;
  if (match[3] === "pm" && hour < 12) hour += 12;
  if (match[3] === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function detectKenzieAction(message: string, now = new Date()): DetectedAction | null {
  const text = message.trim().replace(/[.!?]+$/, "");
  const note = text.match(/^leave\s+(.+?)\s+a\s+note\s+(?:that|saying)\s+(.+)$/i)
    ?? text.match(/^tell\s+(.+?)\s+(.+)$/i);
  if (note) return { kind: "create_note_request", recipientSearch: note[1].trim(), message: note[2].trim() };

  const reminder = text.match(/^remind\s+(.+?)\s+(today|tomorrow|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{4}-\d{2}-\d{2})(?:\s+at\s+(morning|afternoon|evening|noon|\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?\s+to\s+(.+)$/i)
    ?? text.match(/^remind\s+(.+?)\s+about\s+(.+?)\s+(today|tomorrow|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{4}-\d{2}-\d{2})(?:\s+at\s+(morning|afternoon|evening|noon|\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?$/i);
  if (reminder) {
    const firstPattern = /\s+to\s+/i.test(text);
    const date = resolveDatePhrase(firstPattern ? reminder[2] : reminder[3], now);
    const time = resolveTimePhrase((firstPattern ? reminder[3] : reminder[4]) ?? "morning");
    const reminderMessage = firstPattern ? reminder[4] : reminder[2];
    if (date && time) {
      return { kind: "create_reminder_request", recipientSearch: reminder[1].trim(), message: reminderMessage.trim(), date, time };
    }
  }
  const shoppingPatterns = [
    /^(?:please\s+)?add\s+(.+?)\s+to\s+(?:the\s+)?(grocery|shopping)(?:\s+list)?$/i,
    /^put\s+(.+?)\s+on\s+(?:the\s+)?(grocery|shopping)(?:\s+list)?$/i,
    /^we\s+need\s+(.+)$/i,
    /^(?:can|could)\s+you\s+add\s+(.+)$/i,
    /^add\s+(.+)$/i,
  ];
  for (const pattern of shoppingPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (
        pattern === shoppingPatterns[shoppingPatterns.length - 1]
        && /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})$/i.test(match[1])
      ) continue;
      return {
        kind: "add_shopping_item",
        name: match[1].trim(),
        listType: match[2]?.toLowerCase() === "shopping" ? "household" : "grocery",
      };
    }
  }

  const day = "(today|tomorrow|(?:next\\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\\d{4}-\\d{2}-\\d{2})";
  const calendar = text.match(new RegExp(`^(?:schedule|add|put)\\s+(.+?)(?:\\s+on)?\\s+${day}(?:\\s+at\\s+|\\s+)(morning|afternoon|evening|noon|\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)$`, "i"));
  if (calendar) {
    const date = resolveDatePhrase(calendar[2], now);
    const time = resolveTimePhrase(calendar[3]);
    if (date && time) return { kind: "create_calendar_event", title: calendar[1].trim(), date, time };
  }
  if (/^(?:schedule|add|put)\s+.+\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})\b/i.test(text)) {
    return { kind: "clarification", message: "What time should I use for that calendar event?" };
  }

  const typedMeal = text.match(new RegExp(`^(?:plan|put|change)\\s+(breakfast|lunch|dinner|snack)\\s+(.+?)(?:\\s+(?:for|on|to)\\s+)${day}$`, "i"));
  const simpleMeal = text.match(new RegExp(`^(?:plan|put)\\s+(.+?)\\s+(?:for|on)\\s+${day}$`, "i"));
  if (typedMeal || simpleMeal) {
    const date = resolveDatePhrase((typedMeal?.[3] ?? simpleMeal?.[2])!, now);
    if (date) {
      return {
        kind: "save_meal",
        mealType: typedMeal
          ? typedMeal[1].toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack"
          : "dinner",
        name: (typedMeal?.[2] ?? simpleMeal?.[1])!.trim(),
        date,
      } as KenzieActionProposal;
    }
  }
  if (/^(?:plan|put|change)\s+.+(?:meal|dinner|breakfast|lunch)/i.test(text)) {
    return { kind: "clarification", message: "Which day should I use for that meal?" };
  }

  const chorePatterns = [
    /^(?:mark|complete)\s+(?:my\s+)?(.+?)(?:\s+chore)?\s+(?:complete|done)$/i,
    /^i\s+(?:finished|completed)\s+(.+)$/i,
    /^complete\s+(?:my\s+)?(.+?)(?:\s+chore)?$/i,
  ];
  for (const pattern of chorePatterns) {
    const match = text.match(pattern);
    if (match) return { kind: "complete_own_chore", title: match[1].trim() };
  }
  return null;
}

function mondayIso(dateValue: string) {
  const value = new Date(`${dateValue}T12:00:00`);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return isoDate(value);
}

async function resolveRecipient(context: CurrentHouseholdContext, search: string) {
  if (/^(me|myself)$/i.test(search.trim())) {
    return { status: "found" as const, id: context.familyMemberId, label: context.displayName, self: true };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "unavailable" as const };
  const { data, error } = await supabase.from("household_memberships")
    .select("family_member_id,family_members!inner(display_name,status)")
    .eq("household_id", context.householdId)
    .eq("status", "active")
    .eq("family_members.status", "active")
    .ilike("family_members.display_name", `%${search.trim()}%`)
    .limit(2);
  if (error) return { status: "unavailable" as const };
  if (!data?.length) return { status: "missing" as const };
  if (data.length > 1) return { status: "ambiguous" as const };
  const member = data[0].family_members as unknown as { display_name: string };
  return {
    status: "found" as const,
    id: data[0].family_member_id,
    label: member.display_name,
    self: data[0].family_member_id === context.familyMemberId,
  };
}

export async function executeKenzieProposal(context: CurrentHouseholdContext, raw: unknown): Promise<KenzieActionResponse> {
  const proposal = kenzieActionProposalSchema.safeParse(raw);
  if (!proposal.success) return { status: "failed", message: "That action request was not valid." };
  const administrative = ["household_manager", "parent"].includes(context.role);
  if (["create_calendar_event", "save_meal"].includes(proposal.data.kind) && !administrative) {
    return { status: "failed", message: "A parent or household manager needs to make that change." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "failed", message: "The household service is unavailable right now." };
  if (proposal.data.kind === "create_note" || proposal.data.kind === "create_reminder") {
    const recipient = await resolveRecipient(context, proposal.data.recipientSearch);
    if (recipient.status !== "found") return { status: "failed", message: "I could not safely resolve that note or reminder recipient." };
    if (!recipient.self && !administrative) return { status: "failed", message: "A parent or household manager needs to send that to another person." };
    if (proposal.data.kind === "create_note") {
      const { error } = await supabase.from("kenzie_notes").insert({
        household_id: context.householdId,
        recipient_member_id: recipient.id,
        title: proposal.data.title,
        message: proposal.data.message,
        related_destination: "/my-headquarters#notes-from-kenzie",
        created_by_kind: "household_member",
        created_by_member_id: context.familyMemberId,
      });
      if (error) return { status: "failed", message: "The note could not be delivered." };
      revalidatePath("/my-headquarters");
      revalidatePath("/notifications");
      revalidatePath("/", "layout");
      return { status: "completed", message: `The note was left for ${recipient.label}.` };
    }
    const dueAt = householdLocalDateTimeToIso(proposal.data.date, proposal.data.time, context.timeZone);
    const dedupeKey = createHash("sha256")
      .update(`${context.householdId}:${recipient.id}:${dueAt}:${proposal.data.message.trim().toLowerCase()}`)
      .digest("hex");
    const { data: reminder, error } = await supabase.from("household_reminders").upsert({
      household_id: context.householdId,
      recipient_member_id: recipient.id,
      message: proposal.data.message,
      due_at: dueAt,
      time_zone: context.timeZone,
      status: "pending",
      related_destination: "/my-headquarters",
      created_by_member_id: context.familyMemberId,
      dedupe_key: dedupeKey,
    }, { onConflict: "household_id,recipient_member_id,dedupe_key" }).select("id").single();
    if (error || !reminder) return { status: "failed", message: "The reminder could not be saved." };
    const { error: notificationError } = await supabase.from("internal_notifications").upsert({
      household_id: context.householdId,
      recipient_member_id: recipient.id,
      kind: "reminder",
      title: "Reminder",
      body: proposal.data.message,
      related_destination: "/my-headquarters",
      source_reminder_id: reminder.id,
      created_by_member_id: context.familyMemberId,
      dedupe_key: `reminder:${dedupeKey}`,
    }, { onConflict: "household_id,recipient_member_id,dedupe_key" });
    if (notificationError) return { status: "failed", message: "The reminder was saved, but its notification could not be prepared." };
    revalidatePath("/my-headquarters");
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return { status: "completed", message: `The reminder was set for ${recipient.label} on ${proposal.data.date} at ${proposal.data.time}.` };
  }
  if (proposal.data.kind === "create_calendar_event") {
    const startsAt = householdLocalDateTimeToIso(proposal.data.date, proposal.data.time, context.timeZone);
    const { data: duplicate } = await supabase.from("schedule_events").select("id")
      .eq("household_id", context.householdId).eq("title", proposal.data.title).eq("starts_at", startsAt).maybeSingle();
    if (duplicate) return { status: "completed", message: "That event is already on the household calendar." };
    const { error } = await supabase.from("schedule_events").insert({
      household_id: context.householdId,
      created_by_member_id: context.familyMemberId,
      title: proposal.data.title,
      category: "family",
      is_all_day: false,
      starts_at: startsAt,
      ends_at: new Date(new Date(startsAt).getTime() + 3600000).toISOString(),
    });
    if (error) return { status: "failed", message: "The event could not be saved." };
    revalidatePath("/schedule");
    return { status: "completed", message: "The event was added to the household calendar." };
  }
  const { data: plan, error: planError } = await supabase.from("meal_plans").upsert({
    household_id: context.householdId,
    week_start: mondayIso(proposal.data.date),
    created_by_member_id: context.familyMemberId,
  }, { onConflict: "household_id,week_start" }).select("id").single();
  if (planError || !plan) return { status: "failed", message: "The meal plan could not be updated." };
  const { error } = await supabase.from("meal_plan_entries").upsert({
    household_id: context.householdId,
    meal_plan_id: plan.id,
    planned_date: proposal.data.date,
    meal_type: proposal.data.mealType,
    name: proposal.data.name,
    status: "planned",
  }, { onConflict: "meal_plan_id,planned_date,meal_type" });
  if (error) return { status: "failed", message: "The meal plan could not be updated." };
  revalidatePath("/meals");
  return { status: "completed", message: "The meal was saved to the family meal plan." };
}

export async function handleImmediateKenzieAction(context: CurrentHouseholdContext, message: string): Promise<KenzieActionResponse | null> {
  const action = detectKenzieAction(message);
  if (!action) return null;
  if (action.kind === "clarification") return { status: "clarification", message: action.message };
  if (action.kind === "create_note_request" || action.kind === "create_reminder_request") {
    const recipient = await resolveRecipient(context, action.recipientSearch);
    if (recipient.status === "missing") return { status: "clarification", message: "I could not find that active household member. Who should receive it?" };
    if (recipient.status === "ambiguous") return { status: "clarification", message: "I found more than one matching household member. Please use their full display name." };
    if (recipient.status !== "found") return { status: "failed", message: "Household members are unavailable right now." };
    if (!recipient.self && !["household_manager", "parent"].includes(context.role)) {
      return { status: "failed", message: "A parent or household manager needs to send that to another person." };
    }
    const proposal: KenzieActionProposal = action.kind === "create_note_request"
      ? {
          kind: "create_note",
          recipientSearch: action.recipientSearch,
          recipientLabel: recipient.label,
          title: "A note for you",
          message: action.message,
        }
      : {
          kind: "create_reminder",
          recipientSearch: action.recipientSearch,
          recipientLabel: recipient.label,
          message: action.message,
          date: action.date,
          time: action.time,
        };
    return {
      status: "proposal",
      proposal,
      message: action.kind === "create_note_request"
        ? `Leave this note for ${recipient.label}?`
        : `Set this reminder for ${recipient.label} on ${action.date} at ${action.time}?`,
    };
  }
  if (action.kind === "create_calendar_event" || action.kind === "save_meal") {
    if (!["household_manager", "parent"].includes(context.role)) {
      return { status: "failed", message: "A parent or household manager needs to make that change." };
    }
    const parsed = kenzieActionProposalSchema.safeParse(action);
    if (!parsed.success) return { status: "failed", message: "Please check the date and details." };
    return {
      status: "proposal",
      proposal: parsed.data,
      message: action.kind === "create_calendar_event"
        ? `Create "${action.title}" on ${action.date} at ${action.time}?`
        : `Save ${action.name} as ${action.mealType} on ${action.date}?`,
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "failed", message: "The household service is unavailable right now." };
  if (action.kind === "add_shopping_item") {
    const listName = action.listType === "grocery" ? "Grocery List" : "Household Shopping List";
    const { data: list, error: listError } = await supabase.from("shopping_lists").upsert({
      household_id: context.householdId,
      name: listName,
      list_type: action.listType,
      created_by_member_id: context.familyMemberId,
    }, { onConflict: "household_id,name,list_type" }).select("id").single();
    if (listError || !list) return { status: "failed", message: "The shopping list is unavailable." };
    const { data: existing } = await supabase.from("shopping_list_items").select("id")
      .eq("household_id", context.householdId).eq("shopping_list_id", list.id)
      .eq("status", "needed").ilike("name", action.name).limit(1).maybeSingle();
    if (existing) return { status: "completed", message: `${action.name} is already on the ${action.listType} list.` };
    const { error } = await supabase.from("shopping_list_items").insert({
      household_id: context.householdId,
      shopping_list_id: list.id,
      name: action.name,
      status: "needed",
      priority: "normal",
      added_by_member_id: context.familyMemberId,
    });
    if (error) return { status: "failed", message: "The item could not be added." };
    revalidatePath("/shopping");
    return { status: "completed", message: `${action.name} was added to the ${action.listType} list.` };
  }
  if (action.kind !== "complete_own_chore") {
    return { status: "failed", message: "That household action is not available." };
  }
  const { data: assignments, error: assignmentError } = await supabase.from("task_assignments")
    .select("id,tasks!inner(title,category,active)")
    .eq("family_member_id", context.familyMemberId)
    .eq("tasks.category", "chore")
    .eq("tasks.active", true)
    .ilike("tasks.title", `%${action.title}%`)
    .limit(2);
  if (assignmentError || !assignments?.length) {
    return { status: "failed", message: "I could not find that chore in your own active chores." };
  }
  if (assignments.length > 1) {
    return { status: "clarification", message: "I found more than one matching chore. Which chore did you finish?" };
  }
  const { error } = await supabase.from("task_completions").upsert({
    task_assignment_id: assignments[0].id,
    completion_date: toZonedDateIso(new Date(), context.timeZone),
    completed_by_member_id: context.familyMemberId,
  }, { onConflict: "task_assignment_id,completion_date" });
  if (error) return { status: "failed", message: "The chore could not be completed." };
  revalidatePath("/my-headquarters");
  revalidatePath("/tasks");
  return { status: "completed", message: `${action.title} was marked complete.` };
}
