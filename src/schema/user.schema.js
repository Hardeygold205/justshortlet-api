import { z } from "zod";
import { PROFILE_MEDIA_TYPES } from "../constants/upload.js";

export const updateMeSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(3).max(50).optional(),
      lastName: z.string().trim().min(3).max(50).optional(),
      username: z.string().trim().min(3).max(30).optional(),
      dob: z.iso.date().optional(),
      bio: z.string().trim().max(300).optional(),
      status: z.enum(["ACTIVE", "DISABLED"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    })
    .openapi("UpdateMeInput"),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(6, "Current password is required"),
      newPassword: z
        .string()
        .min(6, "New password must be at least 8 characters"),
    })
    .openapi("changePasswordInput"),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid user id"),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(""),
  }),
});

export const updateProfileMediaSchema = z.object({
  params: z.object({
    type: z.enum(PROFILE_MEDIA_TYPES).openapi({ example: "avatar" }),
  }),
});

export const upgradeToHostSchema = z.object({
  body: z.object({}).optional(),
});

export const requestVerifyEmailSchema = z.object({
  body: z.object({
    email: z
      .email("email is required")
      .openapi({ example: "user@example.com" }),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z
      .email("email is required")
      .openapi({ example: "user@example.com" }),
    code: z.string().length(6).openapi({ example: "123456" }),
  }),
});

export const requestVerifyPhoneSchema = z.object({
  body: z.object({
    phone: z.string().min(10).openapi({ example: "08123456789" }),
  }),
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    phone: z.string().min(10).openapi({ example: "08123456789" }),
    code: z.string().length(6).openapi({ example: "123456" }),
  }),
});

export const adminUpdateUserSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z
    .object({
      role: z.enum(["GUEST", "HOST"]).optional(),
      status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});
