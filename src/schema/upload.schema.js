import { z } from "zod";
import { UPLOAD_FOLDERS, CATEGORIES } from "../constants/upload.js";

export const uploadFileSchema = z.object({
  body: z.object({
    folder: z
      .enum(UPLOAD_FOLDERS)
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
      .enum(UPLOAD_FOLDERS)
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
  }),
});
