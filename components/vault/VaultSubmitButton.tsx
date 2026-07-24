"use client";

import { useFormStatus } from "react-dom";

export function VaultSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-live="polite">{pending ? "Uploading securely…" : label}</button>;
}
