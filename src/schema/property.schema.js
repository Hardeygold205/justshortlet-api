import { z } from "zod";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "DUPLEX",
  "STUDIO",
  "PENTHOUSE",
  "VILLA",
  "OTHER",
];
const CANCELLATION_POLICIES = [
  "FLEXIBLE",
  "MODERATE",
  "STRICT",
  "NON_REFUNDABLE",
];

const propertyBodyShape = {
  title: z.string().trim().min(10).max(150),
  description: z.string().trim().max(3000).optional(),
  type: z.enum(PROPERTY_TYPES),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().int().min(0).max(50),
  beds: z.coerce.number().int().min(1).max(50).optional(),
  maxGuests: z.coerce.number().int().min(1).max(50),
  pricePerNight: z.coerce.number().positive(),
  cleaningFee: z.coerce.number().min(0).optional(),
  serviceFeePercent: z.coerce.number().min(0).max(100).optional(),
  weeklyDiscountPercent: z.coerce.number().min(0).max(100).optional(),
  monthlyDiscountPercent: z.coerce.number().min(0).max(100).optional(),
  minNights: z.coerce.number().int().min(1).optional(),
  maxNights: z.coerce.number().int().min(1).optional(),
  checkInTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format")
    .optional(),
  checkOutTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format")
    .optional(),
  houseRules: z.array(z.string().trim().max(200)).max(30).optional(),
  cancellationPolicy: z.enum(CANCELLATION_POLICIES).optional(),
  amenityIds: z.array(z.string().uuid()).optional(),
};

export const createPropertySchema = z.object({
  body: z.object(propertyBodyShape),
});

export const updatePropertySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object(
      Object.fromEntries(
        Object.entries(propertyBodyShape).map(([k, v]) => [k, v.optional()]),
      ),
    )
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const propertyIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listPropertiesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    city: z.string().optional(),
    type: z.enum(PROPERTY_TYPES).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    guests: z.coerce.number().int().min(1).optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    amenities: z.string().optional(),
    checkIn: z.iso.date().optional(),
    checkOut: z.iso.date().optional(),
  }),
});

export const adminUpdateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["PUBLISHED", "REJECTED", "SUSPENDED", "ARCHIVED"]),
    rejectionReason: z.string().trim().max(500).optional(),
  }),
});

export const calendarQuerySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  }),
});

export const blockDatesSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    reason: z.string().trim().max(200).optional(),
  }),
});
