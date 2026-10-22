import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const passwordSchema = z.string().min(1, "Password is required");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number"),
});

export type LoginPayload = z.infer<typeof loginSchema>;
export type RegisterPayload = z.infer<typeof registerSchema>;