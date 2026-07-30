import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KenzieConnectionTest } from "@/components/kenzie/KenzieConnectionTest";

describe("Kenzie connection test control", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends only the fixed connection request and displays the safe result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          message: "Kenzie connection successful.",
          model: "gpt-5.6-luna",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<KenzieConnectionTest />);
    await userEvent.click(
      screen.getByRole("button", { name: "Test secure AI connection" }),
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/kenzie/connection-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "connection" }),
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Kenzie connection successful. Model: gpt-5.6-luna.",
    );
  });

  it("shows a sanitized error when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<KenzieConnectionTest />);
    await userEvent.click(
      screen.getByRole("button", { name: "Test secure AI connection" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The connection test could not be completed.",
    );
  });
});
