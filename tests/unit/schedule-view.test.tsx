import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ScheduleView from "@/components/schedule/ScheduleView";
import { scheduleEvents } from "@/lib/features/mock-data";

const today = "2026-07-25";
const events = scheduleEvents.map((event, index) => ({ ...event, date: index === 0 ? today : `2026-07-${String(26 + index).padStart(2, "0")}` }));

describe("ScheduleView", () => {
  it("switches among calendar views and keeps household events", async () => {
    const user = userEvent.setup();
    render(<ScheduleView events={events} members={[]} canManage={false} today={today} />);
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Day" }));
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(events[0].title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agenda" }));
    expect(screen.getByRole("button", { name: "Agenda" })).toHaveAttribute("aria-pressed", "true");
  });
});
