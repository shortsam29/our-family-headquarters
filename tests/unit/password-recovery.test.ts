import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { newPasswordSchema, passwordRecoveryRedirectUrl, recoveryEmailSchema, safeRecoveryNext } from "@/lib/auth/recovery";
import { restorePasswordRecoverySession, saveRecoveredPassword } from "@/lib/auth/recovery-client";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("password recovery", () => {
  it("validates email and strong matching passwords", () => {
    expect(recoveryEmailSchema.safeParse("not-an-email").success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "Short1", confirmPassword: "Short1" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "StrongFamily1", confirmPassword: "Different1" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "StrongFamily1", confirmPassword: "StrongFamily1" }).success).toBe(true);
  });

  it("uses safe recovery destinations", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://family.example");
    expect(passwordRecoveryRedirectUrl()).toBe("https://family.example/reset-password");
    expect(safeRecoveryNext("/reset-password")).toBe("/reset-password");
    expect(safeRecoveryNext("//outside.example")).toBe("/reset-password");
    expect(safeRecoveryNext("https://outside.example")).toBe("/reset-password");
  });

  it("handles expired recovery links without a session", async () => {
    const auth = { setSession: vi.fn(), getSession: vi.fn().mockResolvedValue({ data: { session: null } }), updateUser: vi.fn(), signOut: vi.fn() };
    await expect(restorePasswordRecoverySession(auth as never, "#error_description=expired")).resolves.toEqual({ ready: false, consumedHash: true });
    await expect(restorePasswordRecoverySession(auth as never, "")).resolves.toEqual({ ready: false, consumedHash: false });
  });

  it("restores a recovery session and updates the password securely", async () => {
    const auth = { setSession: vi.fn().mockResolvedValue({ error: null }), getSession: vi.fn().mockResolvedValue({ data: { session: { user: {} } } }), updateUser: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({ error: null }) };
    await expect(restorePasswordRecoverySession(auth as never, "#access_token=access&refresh_token=refresh&type=recovery")).resolves.toEqual({ ready: true, consumedHash: true });
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: "access", refresh_token: "refresh" });
    await expect(saveRecoveredPassword(auth as never, { password: "StrongFamily1", confirmPassword: "StrongFamily1" })).resolves.toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "StrongFamily1" });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("keeps public responses neutral and manager lookup household-scoped", () => {
    const actions = readFileSync("app/auth/actions.ts", "utf8");
    const migration = readFileSync("supabase/migrations/20260727010000_password_recovery_assistance.sql", "utf8");
    const template = readFileSync("supabase/templates/recovery.html", "utf8");
    expect(actions).toContain("return { sent: true }");
    expect(actions).not.toMatch(/email (exists|does not exist)/i);
    expect(migration).toContain("actor_member.role in ('household_manager', 'parent')");
    expect(migration).toContain("fm.household_id = actor.household_id");
    expect(template).toContain("Our Family Headquarters");
    expect(template).toContain("{{ .TokenHash }}");
    expect(template).toContain("expires in one hour");
  });
});
