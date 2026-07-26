"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { restorePasswordRecoverySession, saveRecoveredPassword } from "@/lib/auth/recovery-client";

export function NewPasswordForm({ initialError }: { initialError?: string }) {
  const client = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!), []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(initialError ? "This password reset link is invalid or has expired. Request a new secure link." : "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    async function restoreRecoverySession() {
      const restored = await restorePasswordRecoverySession(client.auth, window.location.hash);
      if (restored.consumedHash) window.history.replaceState(null, "", window.location.pathname);
      if (!active) return;
      if (restored.ready) setReady(true);
      else setError("This password reset link is invalid or has expired. Request a new secure link.");
    }
    void restoreRecoverySession();
    return () => { active = false; };
  }, [client]);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    const result = await saveRecoveredPassword(client.auth, { password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.assign("/sign-in?status=password-updated");
  }

  if (!ready) return <div>{error ? <><p role="alert">{error}</p><Link href="/forgot-password">Request another reset email</Link></> : <p role="status">Preparing your secure password reset...</p>}</div>;
  return <form action={submit} aria-describedby="password-guidance">
    {error ? <p role="alert">{error}</p> : null}
    <label htmlFor="newPassword">New Password<input id="newPassword" name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
    <p id="password-guidance">Use at least 10 characters, including uppercase, lowercase, and a number.</p>
    <label htmlFor="confirmPassword">Confirm Password<input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
    <button type="submit" disabled={pending}>{pending ? "Saving..." : "Save New Password"}</button>
  </form>;
}
