import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Valid email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password is too long"),
    first_name: z.string().trim().min(1, "First name is required").optional(),
    last_name: z.string().trim().min(1, "Last name is required").optional(),
    username: z.string().trim().min(3).max(30).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
