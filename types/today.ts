export type ContentScope = "household" | "member";

export type SectionState<T> =
  | { status: "populated"; data: T }
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message?: string };

export type FamilyMember = {
  id: string;
  displayName: string;
  initials: string;
  role: "adult" | "child";
};

export type WeatherSummary = {
  temperature: number;
  feelsLike: number;
  condition: string;
  message: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  daypart: "Morning" | "Afternoon" | "Evening";
  scope: ContentScope;
};

export type DinnerPlan = {
  id: string;
  name: string;
  details?: string;
  scope: "household";
};

export type TodayTaskCategory = "chore" | "homework" | "routine" | "personal";
export type TodayTaskDaypart = "Morning" | "Afternoon" | "Evening";

export type TodayTask = {
  id: string;
  title: string;
  category?: TodayTaskCategory;
  daypart?: TodayTaskDaypart;
  dueTime?: string;
  completed: boolean;
  assigneeId: FamilyMember["id"];
  scope: "member";
};

export type FamilyUpdate = {
  id: string;
  message: string;
  scope: "household";
};

export type HouseholdPreview = {
  id: string;
  title: string;
  message: string;
  count?: number;
  scope: "household";
  tone: "sage" | "blush" | "taupe" | "blue";
  symbol: string;
};

export type ShoppingPreview = HouseholdPreview & { kind: "shopping" };
export type GroceryPreview = HouseholdPreview & { kind: "grocery" };
export type FamilyInboxPreview = HouseholdPreview & { kind: "inbox" };
export type UpcomingItem = HouseholdPreview & { kind: "upcoming" };

export type KenzieNote = {
  id: string;
  title?: string;
  message: string;
  signature: "❤️ Kenzie";
  audience: "family" | "adult" | "child";
  scope: ContentScope;
};

export type TodayExperienceData = {
  currentMember: FamilyMember;
  weather: SectionState<WeatherSummary>;
  schedule: SectionState<ScheduleItem[]>;
  dinner: SectionState<DinnerPlan>;
  tasks: SectionState<TodayTask[]>;
  familyUpdates: SectionState<FamilyUpdate[]>;
  shopping: SectionState<ShoppingPreview>;
  grocery: SectionState<GroceryPreview>;
  inbox: SectionState<FamilyInboxPreview>;
  upcoming: SectionState<UpcomingItem>;
  kenzie: SectionState<KenzieNote>;
};
