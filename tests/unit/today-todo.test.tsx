import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TodayToDoCard from "@/components/today/TodayToDoCard";
import type { TodayTask } from "@/types/today";

const task: TodayTask = {
  id: "task-test",
  title: "Read for fifteen minutes",
  category: "personal",
  daypart: "Evening",
  completed: false,
  assigneeId: "member-current",
  scope: "member",
};

describe("TodayToDoCard", () => {
  it("allows completion and reversal with accessible controls", async () => {
    const user = userEvent.setup();
    render(<TodayToDoCard state={{ status: "populated", data: [task] }} />);

    await user.click(screen.getByRole("button", { name: "Mark complete: Read for fifteen minutes" }));
    expect(screen.getByRole("button", { name: "Mark incomplete: Read for fifteen minutes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Mark complete: Read for fifteen minutes" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders a calm empty state", () => {
    render(<TodayToDoCard state={{ status: "empty" }} />);
    expect(screen.getByText("You’re all caught up")).toBeInTheDocument();
  });
});
