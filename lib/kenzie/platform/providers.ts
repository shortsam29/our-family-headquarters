import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { resolveAuthenticatedMemberProfile } from "@/lib/kenzie/profiles/association";
import type { KenzieContextProvider } from "@/lib/kenzie/platform/types";

export const householdProvider: KenzieContextProvider = {
  id: "household",
  async load(context) {
    return {
      status: "available",
      data: { householdName: context.householdName, timeZone: context.timeZone },
    };
  },
};

export const memberProvider: KenzieContextProvider = {
  id: "member",
  async load(context) {
    const profile = await resolveAuthenticatedMemberProfile(context);
    return {
      status: "available",
      data: { profileKey: profile.key, role: context.role },
    };
  },
};

export const permissionProvider: KenzieContextProvider = {
  id: "permissions",
  async load(context) {
    const administrative = context.role === "household_manager" || context.role === "parent";
    return {
      status: "available",
      data: {
        canManageHousehold: administrative,
        canManageOtherMembers: administrative,
        canActForSelf: true,
      },
    };
  },
};

export async function assembleKenziePlatformContext(
  context: CurrentHouseholdContext,
  providers: KenzieContextProvider[],
) {
  const assembled: Record<string, Record<string, unknown>> = {};
  for (const provider of providers) {
    let result;
    try {
      result = await provider.load(context);
    } catch {
      result = { status: "unavailable" as const };
    }
    if (result.status === "available") assembled[provider.id] = result.data;
  }
  return assembled;
}
