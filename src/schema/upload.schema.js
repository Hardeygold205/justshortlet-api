import { z } from "zod";

const CATEGORIES = ["image", "video", "audio", "doc"];

export const uploadFileSchema = z.object({
  body: z.object({
    folder: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Folder can only contain letters, numbers, hyphens and underscores",
      )
      .optional()
      .default("general")
      .openapi({ example: "posts" }),
  }),
  params: z.object({
    category: z.enum(CATEGORIES).openapi({ example: "image" }),
  }),
});

export const uploadAnyFileSchema = z.object({
  body: z.object({
    folder: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .optional()
      .default("general")
      .openapi({ example: "posts" }),
  }),
});

export const deleteFileSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .min(1, "File identifier is required")
      .openapi({ example: "images/171234-abc.jpg" }),
    resourceType: z.enum(["image", "video", "raw"]).optional().default("image"),
  }),
});
