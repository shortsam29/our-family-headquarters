import { z } from "zod";

export const recoveryEmailSchema = z.email("Enter a valid email address.");
export const newPasswordSchema = z.object({
  password: z.string()
    .min(10, "Use at least 10 characters.")
    .max(200, "Use no more than 200 characters.")
    .regex(/[a-z]/, "Include a lowercase letter.")
    .regex(/[A-Z]/, "Include an uppercase letter.")
    .regex(/[0-9]/, "Include a number."),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "The passwords do not match.",
  path: ["confirmPassword"],
});

export function passwordRecoveryRedirectUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const base = configured || (vercel ? `https://${vercel}` : process.env.NODE_ENV === "production" ? "https://our-family-headquarters.vercel.app" : "http://localhost:3000");
  return new URL("/reset-password", base).toString();
}

export function safeRecoveryNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/reset-password";
}
