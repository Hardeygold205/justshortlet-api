import { z } from "zod";

export const createBookingSchema = z.object({
  body: z
    .object({
      propertyId: z.string().uuid(),
      checkIn: z.iso.date(),
      checkOut: z.iso.date(),
      guests: z.coerce.number().int().min(1),
      guestNote: z.string().trim().max(500).optional(),
    })
    .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
      message: "checkOut must be after checkIn",
      path: ["checkOut"],
    }),
});

export const bookingIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    status: z
      .enum(["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"])
      .optional(),
    propertyId: z.string().uuid().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }),
});

export const rejectBookingSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().trim().min(5).max(500),
  }),
});

export const confirmBookingSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    hostNote: z.string().trim().max(500).optional(),
  }),
});

export const checkAvailabilitySchema = z.object({
  query: z.object({
    propertyId: z.string().uuid(),
    checkIn: z.iso.date(),
    checkOut: z.iso.date(),
  }),
});
