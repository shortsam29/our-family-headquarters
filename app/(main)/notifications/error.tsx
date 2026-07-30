"use client";

export default function NotificationsError({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <p>Your notifications are temporarily unavailable.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
