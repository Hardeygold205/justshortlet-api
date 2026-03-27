import { z } from "zod";

export const updateMeSchema = z.object({
  body: z
    .object({
      first_name: z.string().trim().min(1).max(50).optional(),
      last_name: z.string().trim().min(1).max(50).optional(),
      username: z.string().trim().min(3).max(30).optional(),
      phone: z.string().trim().min(7).max(20).optional(),
      dob: z.string().date().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      avatar_url: z
        .string()
        .trim()
        .url("Avatar must be a valid URL")
        .optional(),
      bio: z.string().trim().max(300).optional(),
      password: z.string().min(6).max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user id"),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(""),
  }),
});