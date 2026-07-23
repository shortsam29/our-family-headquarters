import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ScheduleView from "@/components/schedule/ScheduleView";
import { scheduleEvents } from "@/lib/features/mock-data";

describe("ScheduleView", () => {
  it("switches from Today to Week without losing household events", async () => {
    const user = userEvent.setup();
    render(<ScheduleView events={scheduleEvents} />);

    expect(screen.getByRole("button", { name: "Today view" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Week view" }));
    expect(screen.getByRole("button", { name: "Week view" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "Today" })).toBeInTheDocument();
  });
});
