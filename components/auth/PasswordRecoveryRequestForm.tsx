"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type PasswordRecoveryState } from "@/app/auth/actions";

const initialState: PasswordRecoveryState = {};

export function PasswordRecoveryRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  if (state.sent) return <div role="status"><p>If an account exists for this email, a password reset link has been sent.</p><p>Please check your inbox and follow the secure link. It will expire after one hour.</p><Link href="/sign-in">Return to Sign In</Link></div>;
  return <form action={action} noValidate>
    {state.error ? <p role="alert">{state.error}</p> : null}
    <label htmlFor="recoveryEmail">Email Address<input id="recoveryEmail" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.email} required /></label>
    <button type="submit" disabled={pending}>{pending ? "Sending…" : "Send Password Reset Email"}</button>
    <Link href="/sign-in">Cancel</Link>
  </form>;
}
