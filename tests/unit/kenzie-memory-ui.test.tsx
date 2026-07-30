import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PersonalMemoryManager } from "@/components/kenzie/PersonalMemoryManager";

vi.mock("@/app/actions/kenzie-memory", () => ({
  deleteAllPersonalMemories: vi.fn(),
  deletePersonalMemory: vi.fn(),
  editPersonalMemory: vi.fn(),
  pauseAutomaticMemory: vi.fn(),
  resumeAutomaticMemory: vi.fn(),
}));

describe("What Kenzie Remembers", () => {
  it("shows transparent controls without internal identifiers", () => {
    render(<PersonalMemoryManager settings={{ enabled: true, acknowledgedAt: "2030-01-01T00:00:00Z" }} memories={[{
      id: "00000000-0000-4000-8000-000000000090",
      category: "learning_preference",
      subject: "explanation style",
      normalizedValue: "examples",
      displayText: "You learn better with examples.",
      durability: "durable",
      confidence: "high",
      updatedAt: "2030-01-02T00:00:00Z",
    }]} />);
    expect(screen.getByText("Automatic memory is on")).toBeInTheDocument();
    expect(screen.getAllByText("You learn better with examples.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Pause automatic memory" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.queryByText("00000000-0000-4000-8000-000000000090")).not.toBeInTheDocument();
  });

  it("shows empty and paused states", () => {
    render(<PersonalMemoryManager settings={{ enabled: false, pausedAt: "2030-01-01T00:00:00Z" }} memories={[]} />);
    expect(screen.getByText("Automatic memory is paused")).toBeInTheDocument();
    expect(screen.getByText(/Kenzie has not saved any personal memories yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume automatic memory" })).toBeInTheDocument();
  });
});
