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

  it("cancels a proposed write without sending a confirmation request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        status: "proposal",
        message: "Create this event?",
        proposal: {
          kind: "create_calendar_event",
          title: "Science review",
          date: "2030-01-08",
          time: "14:00",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<KenzieDevelopmentChat memberName="Family Member" />);
    fireEvent.change(screen.getByLabelText("Message Kenzie"), {
      target: { value: "Create a calendar event tomorrow at 2 PM called Science review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByText("Action preview")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Don't save" }));

    await waitFor(() => expect(screen.queryByText("Action preview")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows an automatic-memory notice and sends an owner-scoped undo request", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          message: "I can use simple examples.",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          memoryNotice: {
            id: "00000000-0000-4000-8000-000000000099",
            displayText: "You prefer explanations with simple examples.",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, status: "completed", message: "Done — I removed that memory." }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<KenzieDevelopmentChat memberName="Family Member" memoryEnabled />);
    fireEvent.change(screen.getByLabelText("Message Kenzie"), {
      target: { value: "I prefer explanations with simple examples." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByText(/Remembered:/)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/settings#kenzie-memory");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/kenzie/memory/extract");
    const undoBody = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(undoBody).toEqual(expect.objectContaining({
      undoMemoryId: "00000000-0000-4000-8000-000000000099",
    }));
  });

  it("does not call extraction when the message opt-out is checked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: "Here is an answer." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<KenzieDevelopmentChat memberName="Family Member" memoryEnabled />);
    fireEvent.change(screen.getByLabelText("Message Kenzie"), {
      target: { value: "I prefer short answers." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Don't remember this message" }));
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/kenzie/chat");
  });
});
