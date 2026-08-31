import { z } from "zod";

export const createAmenitySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(50),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
    category: z.string().trim().max(50).optional(),
    icon: z.string().trim().max(50).optional(),
  }),
});

export const updateAmenitySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(50).optional(),
      slug: z
        .string()
        .trim()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      category: z.string().trim().max(50).optional(),
      icon: z.string().trim().max(50).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const amenityIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
