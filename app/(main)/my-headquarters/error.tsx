"use client";

export default function MyHeadquartersError({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <p>Your Personal Headquarters is temporarily unavailable.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
