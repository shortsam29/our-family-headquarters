import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FamilyWishListDashboard } from "@/components/personal/FamilyWishListDashboard";

describe("FamilyWishListDashboard", () => {
  it("shows every member alphabetically with live wish details and empty cards", () => {
    render(<FamilyWishListDashboard groups={[
      { memberId: "1", displayName: "Emma", items: [{ id: "wish-1", itemName: "Art Supplies", storeWebsite: "Hobby Lobby", notes: "Watercolors", createdAt: "2026-07-25T12:00:00Z" }] },
      { memberId: "2", displayName: "Jason", items: [] },
    ]} />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["⭐ Emma's Wish List", "⭐ Jason's Wish List"]);
    expect(screen.getByText("Art Supplies")).toBeInTheDocument();
    expect(screen.getByText("Hobby Lobby")).toBeInTheDocument();
    expect(screen.getByText("Watercolors")).toBeInTheDocument();
    expect(screen.getByText("No wish list items yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
