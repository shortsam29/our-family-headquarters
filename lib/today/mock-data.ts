import type { TodayExperienceData } from "@/types/today";

const currentMember = {
  id: "member-current",
  displayName: "Family Member",
  initials: "FM",
  role: "adult",
} as const;

export const todayMockData: TodayExperienceData = {
  currentMember,
  weather: {
    status: "populated",
    data: {
      temperature: 72,
      feelsLike: 73,
      condition: "Partly Cloudy",
      message: "Beautiful day ahead.",
    },
  },
  schedule: {
    status: "populated",
    data: [
      { id: "schedule-morning", title: "A gentle start to the day", daypart: "Morning", scope: "household" },
      { id: "schedule-afternoon", title: "Family plans will appear here", daypart: "Afternoon", scope: "household" },
      { id: "schedule-evening", title: "Time together at home", daypart: "Evening", scope: "household" },
    ],
  },
  dinner: {
    status: "populated",
    data: {
      id: "dinner-today",
      name: "Spaghetti & Meatballs",
      details: "With garlic bread and green salad",
      scope: "household",
    },
  },
  tasks: {
    status: "populated",
    data: [
      { id: "task-make-bed", title: "Make bed", category: "routine", daypart: "Morning", completed: false, assigneeId: currentMember.id, scope: "member" },
      { id: "task-feed-pet", title: "Feed the dog", category: "chore", daypart: "Morning", completed: false, assigneeId: currentMember.id, scope: "member" },
      { id: "task-dishwasher", title: "Unload dishwasher", category: "chore", daypart: "Afternoon", completed: false, assigneeId: currentMember.id, scope: "member" },
      { id: "task-trash", title: "Take out trash", category: "chore", daypart: "Afternoon", completed: false, assigneeId: currentMember.id, scope: "member" },
      { id: "task-study", title: "Homework / Study time", category: "homework", daypart: "Evening", completed: false, assigneeId: currentMember.id, scope: "member" },
      { id: "task-reading", title: "15 minutes of reading", category: "personal", daypart: "Evening", completed: false, assigneeId: currentMember.id, scope: "member" },
    ],
  },
  familyUpdates: { status: "empty" },
  shopping: {
    status: "populated",
    data: { id: "shopping-preview", kind: "shopping", title: "Shopping List", message: "Shared household items.", count: 3, scope: "household", tone: "sage", symbol: "S" },
  },
  grocery: {
    status: "populated",
    data: { id: "grocery-preview", kind: "grocery", title: "Grocery List", message: "The next grocery list will be easy to find.", count: 5, scope: "household", tone: "blush", symbol: "G" },
  },
  inbox: {
    status: "populated",
    data: { id: "inbox-preview", kind: "inbox", title: "Family Inbox", message: "Family requests will have one calm place.", count: 2, scope: "household", tone: "blue", symbol: "F" },
  },
  upcoming: {
    status: "populated",
    data: { id: "upcoming-preview", kind: "upcoming", title: "Coming Up", message: "A few helpful reminders for the week.", count: 2, scope: "household", tone: "taupe", symbol: "C" },
  },
  kenzie: {
    status: "populated",
    data: {
      id: "kenzie-today",
      title: "A note from Kenzie",
      message: "Your day has a place to land. We’ll keep it simple and take it one step at a time.",
      signature: "❤️ Kenzie",
      audience: "family",
      scope: "member",
    },
  },
};
