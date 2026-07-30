"use client";

export default function KenzieError({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <p>Kenzie is temporarily unavailable. The rest of your family headquarters still works.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
