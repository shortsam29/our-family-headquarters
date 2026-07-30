import type { ContentScope, FamilyMember, KenzieNote, SectionState, TodayTask } from "./today";

export type ScheduleView = "day" | "week" | "month";
export type EventCategory = "household" | "family" | "school" | "work" | "appointment" | "celebration";

export type ScheduleEvent = {
  id: string;
  seriesId?: string;
  seriesStartDate?: string;
  title: string;
  date: string;
  endDate?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  category: EventCategory;
  ownerId: FamilyMember["id"];
  participantIds: FamilyMember["id"][];
  location?: string;
  recurrence?: "daily" | "weekly" | "monthly" | "yearly";
  reminderMinutes?: number;
  scope: ContentScope;
};

export type FamilyMemberSummary = FamilyMember & {
  relationship: string;
  birthdayLabel?: string;
  nextRelevantItem?: string;
};

export type HouseholdAssetSummary = {
  id: string;
  kind: "pet" | "vehicle" | "contact";
  name: string;
  summary: string;
  access: "household" | "adults";
};

export type FamilyHubUpdate = {
  id: string;
  title: string;
  message: string;
  audience: "household" | "adults";
  type: "announcement" | "conversation";
};

export type PersonalReminder = {
  id: string;
  title: string;
  when: string;
  scope: "member";
};

export type MyDayData = {
  member: FamilyMember;
  schedule: SectionState<ScheduleEvent[]>;
  tasks: SectionState<TodayTask[]>;
  reminders: SectionState<PersonalReminder[]>;
  kenzie: SectionState<KenzieNote>;
};

export type SecondaryDestination = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  group: "Plan & provide" | "Care for home" | "Protect & organize";
  ownership: string;
  highlights: Array<{ title: string; detail: string }>;
  emptyMessage: string;
};
