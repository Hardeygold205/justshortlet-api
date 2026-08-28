import { z } from "zod";

const ACTIVITY_TYPES = [
  "ACCOUNT_CREATED",
  "ACCOUNT_UPDATED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_DISABLED",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_DELETED",
  "ROLE_CHANGED",
  "BOOKING_CREATED",
  "BOOKING_UPDATED",
  "BOOKING_CANCELLED",
  "PAYMENT_INITIATED",
  "PAYMENT_COMPLETED",
  "PAYMENT_FAILED",
  "SYSTEM_EVENT",
];

const activityQueryShape = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.enum(["ACCOUNT", "BOOKING", "TRANSACTION", "SYSTEM"]).optional(),
  type: z.enum(ACTIVITY_TYPES).optional(),
  timeframe: z.enum(["24h", "7d", "30d"]).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
};

export const listActivitiesSchema = z.object({
  query: z.object({
    ...activityQueryShape,
    actorId: z.string().uuid().optional(),
    targetId: z.string().uuid().optional(),
  }),
});

export const userActivitiesSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  query: z.object(activityQueryShape),
});
