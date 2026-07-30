import { z } from "zod";
import type { CurrentHouseholdContext } from "@/lib/auth/context";

export type KenzieActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unauthenticated" | "invalid_input" | "forbidden" | "failed" };

export interface KenzieActionDefinition<I, O> {
  id: string;
  input: z.ZodType<I>;
  authorize(context: CurrentHouseholdContext, input: I): boolean | Promise<boolean>;
  execute(context: CurrentHouseholdContext, input: I): Promise<O>;
}

export async function executeKenzieAction<I, O>(
  context: CurrentHouseholdContext | null,
  definition: KenzieActionDefinition<I, O>,
  untrustedInput: unknown,
): Promise<KenzieActionResult<O>> {
  if (!context || context.source !== "supabase") return { ok: false, reason: "unauthenticated" };
  const input = definition.input.safeParse(untrustedInput);
  if (!input.success) return { ok: false, reason: "invalid_input" };
  try {
    if (!await definition.authorize(context, input.data)) return { ok: false, reason: "forbidden" };
    return { ok: true, value: await definition.execute(context, input.data) };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export function requireAdministrativeRole(context: CurrentHouseholdContext) {
  return context.role === "household_manager" || context.role === "parent";
}

export function requireSameHousehold(context: CurrentHouseholdContext, householdId: string) {
  return context.householdId === householdId;
}
