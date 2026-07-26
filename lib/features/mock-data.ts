import type {
  FamilyHubUpdate,
  FamilyMemberSummary,
  HouseholdAssetSummary,
  MyDayData,
  ScheduleEvent,
  SecondaryDestination,
} from "@/types/features";
import { todayMockData } from "@/lib/today/mock-data";

export const familyMembers: FamilyMemberSummary[] = [
  { id: "member-current", displayName: "Family Member", initials: "FM", role: "adult", relationship: "Adult", birthdayLabel: "Birthday later this season", nextRelevantItem: "Evening family time" },
  { id: "member-adult-two", displayName: "Household Adult", initials: "HA", role: "adult", relationship: "Adult", nextRelevantItem: "Workday ends at 5:00 PM" },
  { id: "member-child-one", displayName: "Young Family Member", initials: "YF", role: "child", relationship: "Child", birthdayLabel: "Birthday next month", nextRelevantItem: "Homework after school" },
];

export const scheduleEvents: ScheduleEvent[] = [
  { id: "event-breakfast", title: "Family breakfast", date: "today", startTime: "7:30 AM", endTime: "8:00 AM", allDay: false, category: "family", ownerId: "member-current", participantIds: ["member-current", "member-child-one"], location: "Home", scope: "household" },
  { id: "event-school", title: "School day", date: "today", startTime: "8:30 AM", endTime: "3:15 PM", allDay: false, category: "school", ownerId: "member-child-one", participantIds: ["member-child-one"], location: "School", scope: "member" },
  { id: "event-library", title: "Library books due", date: "tomorrow", allDay: true, category: "school", ownerId: "member-child-one", participantIds: ["member-child-one"], scope: "member" },
  { id: "event-dentist", title: "Dental appointment", date: "Saturday", startTime: "10:00 AM", endTime: "11:00 AM", allDay: false, category: "appointment", ownerId: "member-current", participantIds: ["member-current"], location: "Family Dental", scope: "member" },
  { id: "event-birthday", title: "Family birthday", date: "Sunday", allDay: true, category: "celebration", ownerId: "member-adult-two", participantIds: ["member-current", "member-adult-two", "member-child-one"], scope: "household" },
];

export const familyHubUpdates: FamilyHubUpdate[] = [
  { id: "update-weekend", title: "Weekend plans", message: "The household conversation is ready for everyone to review.", audience: "household", type: "conversation" },
  { id: "update-library", title: "Library reminder", message: "Books are due tomorrow. This announcement is informational, not a task.", audience: "household", type: "announcement" },
];

export const householdAssets: HouseholdAssetSummary[] = [
  { id: "pet-one", kind: "pet", name: "Family Pet", summary: "Feeding routine and care reminders", access: "household" },
  { id: "vehicle-one", kind: "vehicle", name: "Household Vehicle", summary: "Registration and maintenance overview", access: "adults" },
  { id: "contact-one", kind: "contact", name: "Emergency Contacts", summary: "Protected contact directory", access: "adults" },
];

export const myDayData: MyDayData = {
  member: todayMockData.currentMember,
  schedule: { status: "populated", data: scheduleEvents.filter((event) => event.scope === "member" || event.participantIds.includes("member-current")) },
  tasks: todayMockData.tasks,
  reminders: { status: "populated", data: [{ id: "reminder-library", title: "Put library books by the door", when: "This evening", scope: "member" }] },
  kenzie: {
    status: "populated",
    data: {
      id: "kenzie-my-day",
      title: "For your day",
      message: "Your plan is ready. Start with what matters most, then take the rest one step at a time.",
      signature: "❤️ Kenzie",
      audience: "family",
      scope: "member",
    },
  },
};

export const secondaryDestinations: SecondaryDestination[] = [
  { slug: "tasks", title: "Tasks", eyebrow: "Chores, homework & routines", description: "Plan responsibilities for today or any future day.", group: "Plan & provide", ownership: "Tasks are managed directly here and summarized in Today and My Day.", highlights: [], emptyMessage: "No tasks need attention." },
  { slug: "meals", title: "Meals", eyebrow: "Meal planning", description: "A calm weekly view of what the household plans to eat.", group: "Plan & provide", ownership: "Meal Planning owns approved meals; Shopping references ingredient needs.", highlights: [{ title: "Tonight", detail: "Spaghetti & Meatballs" }, { title: "Tomorrow", detail: "Sheet-pan chicken" }, { title: "Planning rhythm", detail: "One week at a time" }], emptyMessage: "No meals are planned yet. A simple plan can begin whenever the household is ready." },
  { slug: "shopping", title: "Shopping", eyebrow: "Household purchasing", description: "Groceries and household purchases gathered into one trusted list.", group: "Plan & provide", ownership: "Shopping owns purchase intent; meals and household care may reference it.", highlights: [{ title: "Groceries", detail: "5 items ready" }, { title: "Household supplies", detail: "3 items ready" }, { title: "Shopping method", detail: "Not selected" }], emptyMessage: "The list is clear. Nothing is waiting to be purchased." },
  { slug: "household", title: "Household Care", eyebrow: "Care for home", description: "Home, pet, maintenance, and emergency responsibilities in one organized place.", group: "Care for home", ownership: "Household Care owns care records and references Schedule, Shopping, and Family Vault.", highlights: [{ title: "Home care", detail: "2 upcoming reminders" }, { title: "Pets", detail: "Daily routine ready" }, { title: "Emergency information", detail: "Protected overview" }], emptyMessage: "No household care items need attention right now." },
  { slug: "pets", title: "Pets", eyebrow: "Household care", description: "Everyday pet routines and permitted care information.", group: "Care for home", ownership: "Pet profiles belong to Household Care; medical documents remain protected in Family Vault.", highlights: [{ title: "Daily care", detail: "Morning and evening feeding" }, { title: "Next reminder", detail: "Routine care check" }, { title: "Access", detail: "Household-safe summary" }], emptyMessage: "No pet profiles have been added." },
  { slug: "contacts", title: "Contacts", eyebrow: "Emergency information", description: "A protected overview of the household’s important contacts.", group: "Care for home", ownership: "Emergency contacts belong to Household Care and respect member permissions.", highlights: [{ title: "Emergency", detail: "Protected contact available" }, { title: "School", detail: "School office directory" }, { title: "Care team", detail: "Adult access only" }], emptyMessage: "No contacts are available to this family member." },
  { slug: "vehicles", title: "Vehicles", eyebrow: "Home records", description: "A quiet overview of household vehicle records and care reminders.", group: "Protect & organize", ownership: "Vehicle documents belong to Family Vault; care reminders belong to Household Care.", highlights: [{ title: "Household vehicle", detail: "Registration on file" }, { title: "Maintenance", detail: "Review later this season" }, { title: "Access", detail: "Adult household members" }], emptyMessage: "No vehicle records are available." },
  { slug: "documents", title: "Family Vault", eyebrow: "Documents", description: "The household’s secure filing cabinet, shown here without sensitive contents.", group: "Protect & organize", ownership: "Family Vault is the authoritative owner of household documents and permissions.", highlights: [{ title: "Home", detail: "3 document summaries" }, { title: "Vehicles", detail: "2 document summaries" }, { title: "Expiring soon", detail: "Nothing urgent" }], emptyMessage: "No document summaries are available to this family member." },
  { slug: "finance", title: "Household Finances", eyebrow: "Financial organization", description: "A permission-aware planning overview—not an accounting dashboard.", group: "Protect & organize", ownership: "Household Finances owns financial records; only approved members may view details.", highlights: [{ title: "Monthly plan", detail: "Adult access required" }, { title: "Upcoming bills", detail: "Protected summary" }, { title: "Savings", detail: "No values exposed in preview" }], emptyMessage: "Financial information is unavailable for this family member." },
  { slug: "settings", title: "Household Preferences", eyebrow: "Settings", description: "A small set of preferences that teaches the home how the household lives.", group: "Protect & organize", ownership: "Household Preferences owns shared settings; personal preferences remain member-specific.", highlights: [{ title: "Grocery day", detail: "Not configured" }, { title: "Seasonal preferences", detail: "Default" }, { title: "Notifications", detail: "Future integration" }], emptyMessage: "No household preferences have been configured." },
];

export const secondaryDestinationBySlug = new Map(secondaryDestinations.map((destination) => [destination.slug, destination]));
