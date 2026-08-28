import { z } from "zod";

export const createReviewSchema = z.object({
  params: z.object({ propertyId: z.string().uuid() }),
  body: z.object({
    bookingId: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      rating: z.coerce.number().int().min(1).max(5).optional(),
      comment: z.string().trim().max(1000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listPropertyReviewsSchema = z.object({
  params: z.object({ propertyId: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
});

export const hostReplySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    hostReply: z.string().trim().min(1).max(1000),
  }),
});
