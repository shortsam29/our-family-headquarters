import type { KenzieNote } from "@/types/today";

export type KenzieContext = {
  audience: KenzieNote["audience"];
  scheduledCount: number;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
  upcomingCount: number;
  dinner?: string;
  shoppingCount?: number;
  conversationCount?: number;
  upcomingBillCount?: number;
  expiringDocumentCount?: number;
  petCareCount?: number;
  vehicleCareCount?: number;
};

export function createKenzieNote(context: KenzieContext): KenzieNote {
  const base = { id: "kenzie-daily-guidance", signature: "❤️ Kenzie" as const, audience: context.audience, scope: "member" as const };
  if (context.petCareCount || context.vehicleCareCount) {
    const total = (context.petCareCount ?? 0) + (context.vehicleCareCount ?? 0);
    return { ...base, title: "A little care is coming up", message: `${total} household ${total === 1 ? "reminder is" : "reminders are"} approaching. There is time to take care of each one calmly.` };
  }
  if (context.upcomingBillCount || context.expiringDocumentCount) {
    const total = (context.upcomingBillCount ?? 0) + (context.expiringDocumentCount ?? 0);
    return { ...base, title: "A quiet planning note", message: `${total} adult household ${total === 1 ? "item is" : "items are"} coming up this month. Nothing needs to be handled all at once.` };
  }
  if (context.conversationCount && context.conversationCount > 0) return { ...base, title: "A family message is waiting", message: `${context.conversationCount} ${context.conversationCount === 1 ? "message may" : "messages may"} need a quick look. You can decide whether anything belongs on Shopping, Tasks, or the calendar.` };
  if (context.shoppingCount && context.shoppingCount > 0) return { ...base, title: "The list is gathering nicely", message: `${context.shoppingCount} ${context.shoppingCount === 1 ? "item is" : "items are"} waiting on the household lists${context.dinner ? `, and ${context.dinner} is planned for dinner` : ""}.` };
  if (context.dinner) return { ...base, title: "Dinner has a place", message: `${context.dinner} is planned for tonight, so one daily question is already answered.` };
  if (context.overdueCount > 0) return { ...base, title: "One gentle place to begin", message: `${context.overdueCount} ${context.overdueCount === 1 ? "item may" : "items may"} need another look. Start with one, and let the rest wait their turn.` };
  if (context.assignedCount > 0 && context.completedCount === context.assignedCount) return { ...base, title: "Your list has a place to rest", message: `You finished ${context.completedCount} ${context.completedCount === 1 ? "item" : "items"} today. The rest of the day can feel a little lighter.` };
  if (context.assignedCount > 0) {
    const remaining = context.assignedCount - context.completedCount;
    return { ...base, title: "One step at a time", message: `${remaining} ${remaining === 1 ? "item is" : "items are"} still waiting today. Choose the next small step when you’re ready.` };
  }
  if (context.scheduledCount > 0) return { ...base, title: "Today already has a rhythm", message: `${context.scheduledCount} ${context.scheduledCount === 1 ? "plan is" : "plans are"} on the household schedule${context.upcomingCount > 0 ? `, with ${context.upcomingCount} more coming up` : ""}. Everything has a place to land.` };
  return { ...base, title: "A little breathing room", message: "Nothing needs your attention right now. This quiet space is part of the plan too." };
}
