import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignInPage from "@/app/sign-in/page";
import AccountHelpPage from "@/app/account-help/page";
import { FamilyMemberManager } from "@/components/family/FamilyMemberManager";

vi.mock("@/app/auth/actions", () => ({ signIn: vi.fn(), sendMemberPasswordReset: vi.fn() }));
vi.mock("@/app/actions/family", () => ({ addFamilyMember: vi.fn(), disableJoinCode: vi.fn(), generateJoinCode: vi.fn(), removeFamilyMember: vi.fn(), updateFamilyMember: vi.fn() }));

describe("password recovery surfaces", () => {
  it("adds friendly account assistance below Sign In", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("link", { name: "Forgot Password?" })).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: "Need Help?" })).toHaveAttribute("href", "/account-help");
    expect(screen.getByRole("link", { name: "Create Household" })).toBeInTheDocument();
  });

  it("explains administrator assistance without technical wording", () => {
    render(<AccountHelpPage />);
    expect(screen.getByText(/contact your household administrator/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Members in Settings/i)).toBeInTheDocument();
  });

  it("shows manager account emails and secure reset actions without password controls", () => {
    render(<FamilyMemberManager members={[{ id: "member-1", displayName: "Family Member", role: "child", status: "active", linkedAccount: true }]} currentMemberId="manager" invitations={[]} accountEmails={{ "member-1": "member@example.test" }} />);
    expect(screen.getByText("member@example.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Password Reset Email" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });
});
