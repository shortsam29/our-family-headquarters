"use client";

import { useState } from "react";

type ConnectionResult = {
  ok: boolean;
  message: string;
  model?: string;
};

export function KenzieConnectionTest() {
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch("/api/kenzie/connection-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "connection" }),
      });
      const data = (await response.json()) as ConnectionResult;
      setResult({
        ok: response.ok && data.ok,
        message:
          typeof data.message === "string"
            ? data.message
            : "The connection test could not be completed.",
        model: response.ok ? data.model : undefined,
      });
    } catch {
      setResult({
        ok: false,
        message:
          "The connection test could not be completed. Check your connection and try again.",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <p className="type-supporting">
        This development-only test sends no household or personal information.
      </p>
      <button
        type="button"
        className="button button--primary"
        onClick={runTest}
        disabled={testing}
      >
        {testing ? "Testing secure connection..." : "Test secure AI connection"}
      </button>
      {result ? (
        <p role={result.ok ? "status" : "alert"}>
          {result.message}
          {result.ok && result.model ? ` Model: ${result.model}.` : ""}
        </p>
      ) : null}
    </div>
  );
}
