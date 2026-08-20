import { z } from "zod";

export const registerSchema = z
  .object({
    body: z.object({
      email: z
        .email("Valid email is required")
        .openapi({ example: "user@example.com" }),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password is too long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain uppercase, lowercase and a number",
        )
        .openapi({ example: "Passw0rd123" }),
      firstName: z.string().trim().min(3).max(100).openapi({ example: "Hadi" }),
      lastName: z
        .string()
        .trim()
        .min(3)
        .max(100)
        .openapi({ example: "Ademola" }),
      username: z
        .string()
        .trim()
        .min(3)
        .max(30)
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers and underscores",
        )
        .openapi({ example: "hardeygold" }),
    }),
  })
  .openapi("RegisterInput");

export const loginSchema = z
  .object({
    body: z.object({
      email: z
        .email("Valid email is required")
        .openapi({ example: "user@example.com" }),
      password: z
        .string()
        .min(8, "Password is required")
        .openapi({ example: "Passw0rd123" }),
    }),
  })
  .openapi("LoginInput");

export const refreshTokenSchema = z
  .object({
    body: z.object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    }),
  })
  .openapi("RefreshTokenInput");

export const supabaseExchangeSchema = z
  .object({
    body: z.object({
      supabaseAccessToken: z.string().min(1, "Supabase token is required"),
    }),
  })
  .openapi("SupabaseExchangeInput");
