import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ScheduleView from "@/components/schedule/ScheduleView";
import type { ScheduleEvent } from "@/types/features";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions/schedule", () => ({ saveScheduleEventState: vi.fn(), deleteScheduleEvent: vi.fn() }));
const event: ScheduleEvent = { id: "event-1", title: "Doctor's appointment", date: "2026-07-22", startTime: "11:00", endTime: "12:00", allDay: false, category: "appointment", ownerId: "member-1", participantIds: ["member-1"], scope: "household" };

describe("ScheduleView", () => {
  it("shows one authoritative event in Month, Week, and Day views", async () => {
    const user = userEvent.setup();
    render(<ScheduleView events={[event]} members={[]} canManage={false} today="2026-07-22" />);
    expect(screen.getAllByText("Doctor's appointment").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Week" }));
    expect(screen.getByText("Doctor's appointment")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Day" }));
    expect(screen.getByText("Doctor's appointment")).toBeInTheDocument();
    expect(screen.getByText("Morning")).toBeInTheDocument();
  });
});