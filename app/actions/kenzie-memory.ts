"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import {
  deleteAllOwnedMemories,
  deleteOwnedMemory,
  setMemorySettings,
  updateOwnedMemory,
} from "@/lib/kenzie/memory/service";
import { sanitizeMemoryText } from "@/lib/kenzie/memory/safety";

const idSchema = z.uuid();

function refresh() {
  revalidatePath("/kenzie");
  revalidatePath("/settings");
  revalidatePath("/my-headquarters");
}

export async function acknowledgeMemoryNotice() {
  const context = await requireCurrentHouseholdContext();
  await setMemorySettings(context, { enabled: true, acknowledge: true });
  refresh();
}

export async function pauseAutomaticMemory() {
  const context = await requireCurrentHouseholdContext();
  await setMemorySettings(context, { enabled: false });
  refresh();
}

export async function resumeAutomaticMemory() {
  const context = await requireCurrentHouseholdContext();
  await setMemorySettings(context, { enabled: true });
  refresh();
}

export async function editPersonalMemory(formData: FormData) {
  const id = idSchema.safeParse(formData.get("memoryId"));
  const displayText = sanitizeMemoryText(String(formData.get("displayText") ?? ""), 500);
  if (!id.success || !displayText) return;
  const context = await requireCurrentHouseholdContext();
  await updateOwnedMemory(context, id.data, displayText);
  refresh();
}

export async function deletePersonalMemory(formData: FormData) {
  const id = idSchema.safeParse(formData.get("memoryId"));
  if (!id.success) return;
  const context = await requireCurrentHouseholdContext();
  await deleteOwnedMemory(context, id.data);
  refresh();
}

export async function deleteAllPersonalMemories(formData: FormData) {
  if (formData.get("confirmation") !== "delete all") return;
  const context = await requireCurrentHouseholdContext();
  await deleteAllOwnedMemories(context);
  refresh();
}
