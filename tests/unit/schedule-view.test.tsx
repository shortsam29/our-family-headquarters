import {render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe,expect,it} from "vitest";
import ScheduleView from "@/components/schedule/ScheduleView";
import {scheduleEvents as events} from "@/lib/features/mock-data";
describe("ScheduleView",()=>{it("uses Day, Week, and Month with a traditional selectable month",async()=>{const user=userEvent.setup();render(<ScheduleView events={events} members={[]} canManage={false} today="2026-07-22"/>);expect(screen.getByRole("button",{name:"Month"})).toHaveAttribute("aria-pressed","true");expect(screen.queryByRole("button",{name:"Agenda"})).not.toBeInTheDocument();await user.click(screen.getByRole("button",{name:"Week"}));expect(screen.getByRole("button",{name:"Week"})).toHaveAttribute("aria-pressed","true");await user.click(screen.getByRole("button",{name:"Day"}));expect(screen.getByRole("button",{name:"Day"})).toHaveAttribute("aria-pressed","true");expect(screen.getByText("Morning")).toBeInTheDocument();expect(screen.getByText("Afternoon")).toBeInTheDocument();expect(screen.getByText("Evening")).toBeInTheDocument()})});
