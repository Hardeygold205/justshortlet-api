import { z } from "zod";

export const initializePaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
    provider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({ reference: z.string().min(1) }),
});

export const paymentWebhookSchema = z.object({
  body: z.record(z.string(), z.any()),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    status: z
      .enum([
        "PENDING",
        "SUCCESSFUL",
        "FAILED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ])
      .optional(),
  }),
});
