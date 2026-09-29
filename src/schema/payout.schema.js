import { z } from "zod";

export const addPayoutInfoSchema = z.object({
  body: z.object({
    bankCode: z.string().min(1),
    accountNumber: z
      .string()
      .regex(/^\d{10}$/, "Account number must be 10 digits"),
    provider: z
      .enum(["PAYSTACK", "FLUTTERWAVE"])
      .optional()
      .default("PAYSTACK"),
  }),
});

export const resolveAccountSchema = z.object({
  query: z.object({
    bankCode: z.string().min(1),
    accountNumber: z
      .string()
      .regex(/^\d{10}$/, "Account number must be 10 digits"),
  }),
});
