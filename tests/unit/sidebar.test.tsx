import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "@/components/Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/schedule",
}));

describe("Sidebar", () => {
  it("marks the current route and uses real route links", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: "Schedule" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Family Hub" })).toHaveAttribute("href", "/family-hub");
  });
});
