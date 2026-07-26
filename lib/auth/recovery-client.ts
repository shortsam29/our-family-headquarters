import type { SupabaseClient } from "@supabase/supabase-js";
import { newPasswordSchema } from "@/lib/auth/recovery";

type RecoveryAuth = Pick<SupabaseClient["auth"], "getSession" | "setSession" | "signOut" | "updateUser">;

export async function restorePasswordRecoverySession(auth: RecoveryAuth, hashValue: string) {
  const hash = new URLSearchParams(hashValue.replace(/^#/, ""));
  if (hash.get("error_description")) return { ready: false, consumedHash: true };
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) return { ready: false, consumedHash: true };
  }
  const { data } = await auth.getSession();
  return { ready: Boolean(data.session), consumedHash: Boolean(accessToken || refreshToken) };
}

export async function saveRecoveredPassword(auth: RecoveryAuth, values: { password: FormDataEntryValue | null; confirmPassword: FormDataEntryValue | null }) {
  const parsed = newPasswordSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Please review your new password." };
  const { error } = await auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false as const, error: "We could not update your password right now. Please request a new reset link and try again." };
  await auth.signOut({ scope: "local" });
  return { ok: true as const };
}
