import { z } from "zod";

export const favoritePropertyParamSchema = z.object({
  params: z.object({ propertyId: z.string().uuid() }),
});

export const listFavoritesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  }),
});
