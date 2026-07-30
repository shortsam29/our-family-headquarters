import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { CurrentHouseholdContext } from "@/lib/auth/context";
import { executeKenzieAction, requireAdministrativeRole, requireSameHousehold } from "@/lib/kenzie/platform/actions";
import { assembleKenziePlatformContext, householdProvider, permissionProvider } from "@/lib/kenzie/platform/providers";
import type { KenzieContextProvider } from "@/lib/kenzie/platform/types";

const context = {
  userId: "00000000-0000-4000-8000-000000000001",
  householdId: "00000000-0000-4000-8000-000000000010",
  familyMemberId: "00000000-0000-4000-8000-000000000020",
  householdName: "Test Home",
  timeZone: "America/New_York",
  displayName: "Authenticated Member",
  role: "child" as const,
  source: "supabase" as const,
};

describe("Kenzie platform context", () => {
  it("assembles only available provider output", async () => {
    const forbidden: KenzieContextProvider = { id: "shopping", load: vi.fn().mockResolvedValue({ status: "forbidden" }) };
    const unavailable: KenzieContextProvider = { id: "calendar", load: vi.fn().mockRejectedValue(new Error("offline")) };
    const result = await assembleKenziePlatformContext(context, [householdProvider, permissionProvider, forbidden, unavailable]);
    expect(result).toEqual({
      household: { householdName: "Test Home", timeZone: "America/New_York" },
      permissions: { canManageHousehold: false, canManageOtherMembers: false, canActForSelf: true },
    });
  });
});

describe("Kenzie action executor", () => {
  const input = z.object({ householdId: z.uuid(), value: z.string().min(1) });
  const execute = vi.fn().mockResolvedValue({ saved: true });
  const definition = {
    id: "test.action",
    input,
    authorize: (current: CurrentHouseholdContext, value: z.infer<typeof input>) =>
      requireAdministrativeRole(current) && requireSameHousehold(current, value.householdId),
    execute,
  };

  it("rejects invalid input before authorization or execution", async () => {
    expect(await executeKenzieAction(context, definition, { householdId: "browser-value", value: "" })).toEqual({ ok: false, reason: "invalid_input" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects children and cross-household targets", async () => {
    expect(await executeKenzieAction(context, definition, { householdId: context.householdId, value: "x" })).toEqual({ ok: false, reason: "forbidden" });
    const manager = { ...context, role: "household_manager" as const };
    expect(await executeKenzieAction(manager, definition, { householdId: "00000000-0000-4000-8000-000000000099", value: "x" })).toEqual({ ok: false, reason: "forbidden" });
  });

  it("executes a validated same-household manager action", async () => {
    const manager = { ...context, role: "household_manager" as const };
    expect(await executeKenzieAction(manager, definition, { householdId: context.householdId, value: "x" })).toEqual({ ok: true, value: { saved: true } });
  });
});
