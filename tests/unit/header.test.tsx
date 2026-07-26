import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "@/components/Header";

vi.mock("@/app/auth/actions", () => ({ signOut: vi.fn() }));

describe("Header", () => {
  it("shows the signed-in family member's initials", () => {
    render(<Header displayName="Alex Morgan" />);
    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});