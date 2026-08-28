import { z } from "zod";

export const createAdminSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(50),
    role: z.enum(["ADMIN", "SUPER_ADMIN"]),
  }),
});

export const updateAdminSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
      status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const adminIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
