import { z } from "zod";

const SELF_REGISTERABLE_ROLES = ["GUEST", "HOST"];

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
      role: z
        .enum(SELF_REGISTERABLE_ROLES)
        .optional()
        .default("GUEST")
        .openapi({ example: "GUEST" }),
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

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .email("Valid email is required")
      .openapi({ example: "user@example.com" }),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .email("Valid email is required")
      .openapi({ example: "user@example.com" }),
    code: z.string().length(6),
    newPassword: z.string().min(8),
  }),
});

export const socialLoginSchema = z.object({
  body: z.object({
    provider: z.enum(["google", "apple"]),
    token: z.string().min(1),
  }),
});

export const phoneOtpRequestSchema = z.object({
  body: z.object({
    phone: z.string().min(10).openapi({ example: "08123456789" }),
  }),
});

export const phoneOtpVerifySchema = z.object({
  body: z.object({
    phone: z.string().min(10).openapi({ example: "08123456789" }),
    code: z.string().length(6).openapi({ example: "123456" }),
  }),
});

export const emailOtpRequestSchema = z.object({
  body: z.object({
    email: z
      .email("email is required")
      .openapi({ example: "user@example.com" }),
  }),
});

export const emailOtpVerifySchema = z.object({
  body: z.object({
    email: z
      .email("email is required")
      .openapi({ example: "user@example.com" }),
    code: z.string().length(6).openapi({ example: "123456" }),
  }),
});
