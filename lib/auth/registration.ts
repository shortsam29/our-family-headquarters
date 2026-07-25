import { z } from "zod";

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().max(100).optional(),
  email: z.email("Enter a valid email address."),
  password: z.string()
    .min(10, "Use at least 10 characters.")
    .max(200)
    .regex(/[a-z]/, "Include a lowercase letter.")
    .regex(/[A-Z]/, "Include an uppercase letter.")
    .regex(/[0-9]/, "Include a number."),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "The passwords do not match.",
  path: ["confirmPassword"],
});

export function displayName(firstName: string, lastName?: string) {
  return [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ");
}

export function registrationErrorCode(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) return "existing-email";
  if (normalized.includes("password") || normalized.includes("weak")) return "weak-password";
  if (normalized.includes("rate")) return "try-later";
  return "create-failed";
}
