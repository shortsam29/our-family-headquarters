import { describe, expect, it } from "vitest";
import { displayName, invitationCodeSchema, invitedRegistrationSchema, registrationErrorCode, registrationSchema } from "@/lib/auth/registration";

const valid = { firstName: "Morgan", lastName: "River", email: "morgan@example.test", password: "WarmFamily1", confirmPassword: "WarmFamily1" };

describe("household administrator registration", () => {
  it("accepts a strong matching account", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
    expect(displayName(valid.firstName, valid.lastName)).toBe("Morgan River");
  });
  it("rejects weak and mismatched passwords", () => {
    expect(registrationSchema.safeParse({ ...valid, password: "short", confirmPassword: "different" }).success).toBe(false);
  });
  it("maps provider errors to family-friendly states", () => {
    expect(registrationErrorCode("User already registered")).toBe("existing-email");
    expect(registrationErrorCode("Password is too weak")).toBe("weak-password");
    expect(registrationErrorCode("Rate limit exceeded")).toBe("try-later");
    expect(registrationErrorCode("Network error")).toBe("create-failed");
  });
  it("normalizes a private family join code", () => {
    expect(invitationCodeSchema.parse("ABCD-1234-EF56-7890")).toBe("ABCD1234EF567890");
    expect(invitedRegistrationSchema.safeParse({ ...valid, invitationCode: "ABCD-1234-EF56-7890" }).success).toBe(true);
    expect(invitationCodeSchema.safeParse("short").success).toBe(false);
  });
});