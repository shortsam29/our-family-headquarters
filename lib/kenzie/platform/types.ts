import type { CurrentHouseholdContext } from "@/lib/auth/context";

export type KenzieContextProviderId =
  | "household"
  | "member"
  | "permissions"
  | "calendar"
  | "shopping"
  | "meals"
  | "chores";

export type KenzieProviderResult =
  | { status: "available"; data: Record<string, unknown> }
  | { status: "unavailable" | "forbidden" };

export interface KenzieContextProvider {
  id: KenzieContextProviderId;
  load(context: CurrentHouseholdContext): Promise<KenzieProviderResult>;
}

export type KenziePlatformContext = Partial<Record<KenzieContextProviderId, Record<string, unknown>>>;
