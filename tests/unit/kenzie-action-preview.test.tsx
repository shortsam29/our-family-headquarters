import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KenzieDevelopmentChat } from "@/components/kenzie/KenzieDevelopmentChat";

describe("Kenzie action preview", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        status: "proposal",
        message: "Set this reminder?",
        proposal: {
          kind: "create_reminder",
          recipientSearch: "me",
          recipientLabel: "Family Member",
          message: "pack my school bag",
          date: "2030-01-07",
          time: "07:00",
          recurrence: "daily",
        },
      }),
    }));
  });

  it("shows exact recurring details and keeps the change pending", async () => {
    render(<KenzieDevelopmentChat memberName="Family Member" />);
    fireEvent.change(screen.getByLabelText("Message Kenzie"), {
      target: { value: "Remind me every day at 7 am to pack my school bag" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByText("Action preview")).toBeInTheDocument());
    expect(screen.getByText("daily", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Nothing changes until you confirm. Kenzie will use your signed-in household permissions.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm and save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit request" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Don't save" })).toBeInTheDocument();
  });
});
