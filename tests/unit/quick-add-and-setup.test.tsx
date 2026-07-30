import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickAdd } from "@/components/quick-add/QuickAdd";

vi.mock("next/navigation", () => ({ usePathname: () => "/tasks" }));
vi.mock("@/app/actions/communications", () => ({ createAnnouncement: vi.fn(), createConversation: vi.fn() }));
vi.mock("@/app/actions/domains", () => ({ createDomainRecord: vi.fn() }));
vi.mock("@/app/actions/schedule", () => ({ saveScheduleEvent: vi.fn() }));
vi.mock("@/app/actions/tasks", () => ({ saveTask: vi.fn() }));

describe("global Quick Add and new-member setup", () => {
  it("offers recurring event and task choices to a household manager", () => {
    render(<QuickAdd
      members={[{ id: "00000000-0000-4000-8000-000000000001", displayName: "Manager", role: "household_manager", status: "active", linkedAccount: true }]}
      today="2030-01-07"
      canManage
    />);

    expect(screen.getByLabelText("Open Quick Add")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Repeat")).toHaveLength(2);
    expect(screen.getByDisplayValue("/tasks")).toHaveAttribute("name", "returnTo");
  });

  it("mounts Quick Add in the signed-in layout and routes new members to their checklist", () => {
    const layout = readFileSync("app/(main)/layout.tsx", "utf8");
    const auth = readFileSync("app/auth/actions.ts", "utf8");
    const settings = readFileSync("app/(main)/settings/page.tsx", "utf8");

    expect(layout).toContain("<QuickAdd");
    expect(auth).toContain('redirect("/settings?setup=member")');
    expect(settings).toContain("Welcome to your family home");
    expect(settings).toContain("Assign Kenzie personalization");
  });
});
