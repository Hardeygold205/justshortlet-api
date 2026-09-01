import { prisma } from "../../config/prisma.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import {
  isDateRangeAvailable,
  getPropertyCalendar,
} from "../../services/availability.service.js";
import { logActivity } from "../activity/activity.service.js";

const slugify = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const generateUniqueSlug = async (title) => {
  const base = slugify(title);
  let slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  const existing = await prisma.property.findUnique({ where: { slug } });
  if (existing) slug = `${base}-${Math.random().toString(36).slice(2, 10)}`;
  return slug;
};

const buildPagination = (total, page, limit, resultCount) => ({
  total,
  totalPages: Math.ceil(total / limit),
  currentPage: page,
  limit,
  hasNextPage: (page - 1) * limit + resultCount < total,
  hasPrevPage: page > 1,
});

const propertyInclude = {
  images: {
    orderBy: { sortOrder: "asc" },
    include: { upload: { select: { url: true, thumbnailUrl: true } } }, // ← add this
  },
  amenities: { include: { amenity: true } },
  host: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
};

export const createProperty = async (hostId, data) => {
  const { amenityIds, ...propertyData } = data;
  const slug = await generateUniqueSlug(data.title);

  const property = await prisma.property.create({
    data: {
      ...propertyData,
      hostId,
      slug,
      status: "DRAFT",
      ...(amenityIds?.length && {
        amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
      }),
    },
    include: propertyInclude,
  });

  await logActivity({
    type: "PROPERTY_CREATED",
    description: `Property "${property.title}" created`,
    actorId: hostId,
    targetId: property.id,
  });

  return property;
};

export const updateProperty = async (propertyId, hostId, data) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError(
      "Not authorized to edit this property",
      STATUS_CODES.FORBIDDEN,
    );

  const shouldResetStatus = ["PUBLISHED", "PENDING_REVIEW"].includes(
    property.status,
  );
  const { amenityIds, ...propertyData } = data;

  const updated = await prisma.$transaction(async (tx) => {
    if (amenityIds !== undefined) {
      await tx.propertyAmenity.deleteMany({ where: { propertyId } });
      if (amenityIds.length) {
        await tx.propertyAmenity.createMany({
          data: amenityIds.map((amenityId) => ({ propertyId, amenityId })),
        });
      }
    }

    return tx.property.update({
      where: { id: propertyId },
      data: {
        ...propertyData,
        ...(shouldResetStatus && { status: "DRAFT" }),
      },
      include: propertyInclude,
    });
  });

  await logActivity({
    type: "PROPERTY_UPDATED",
    description: `Property "${property.title}" updated`,
    actorId: hostId,
    targetId: propertyId,
    ...(shouldResetStatus && {
      metadata: { note: "Reverted to DRAFT after edit, requires re-review" },
    }),
  });

  return updated;
};

export const deleteProperty = async (propertyId, hostId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError(
      "Not authorized to delete this property",
      STATUS_CODES.FORBIDDEN,
    );

  const activeBooking = await prisma.booking.findFirst({
    where: { propertyId, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (activeBooking) {
    throw new AppError(
      "Cannot delete a property with active bookings",
      STATUS_CODES.CONFLICT,
    );
  }

  await prisma.property.delete({ where: { id: propertyId } });

  await logActivity({
    type: "PROPERTY_DELETED",
    description: `Property "${property.title}" deleted`,
    actorId: hostId,
    targetId: propertyId,
  });
};

export const submitPropertyForReview = async (propertyId, hostId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);
  if (property.status !== "DRAFT" && property.status !== "REJECTED") {
    throw new AppError(
      `Cannot submit a property with status ${property.status}`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const imageCount = await prisma.propertyImage.count({
    where: { propertyId },
  });
  if (imageCount < 3) {
    throw new AppError(
      "Add at least 3 photos before submitting for review",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: { status: "PENDING_REVIEW", rejectionReason: null },
  });

  await logActivity({
    type: "PROPERTY_SUBMITTED",
    description: `Property "${property.title}" submitted for review`,
    actorId: hostId,
    targetId: propertyId,
  });

  return updated;
};

/**
 * @param {string} hostId
 * @param {{ page?: number, limit?: number, status?: string }} [query]
 */

export const getMyProperties = async (
  hostId,
  { page = 1, limit = 20, status } = {},
) => {
  const where = { hostId, ...(status && { status }) };
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties,
    pagination: buildPagination(total, page, limit, properties.length),
  };
};

export const getMyPropertyById = async (propertyId, hostId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: propertyInclude,
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);
  return property;
};

export const listPublicProperties = async (query) => {
  const {
    page = 1,
    limit = 20,
    city,
    type,
    minPrice,
    maxPrice,
    guests,
    bedrooms,
    amenities,
    checkIn,
    checkOut,
  } = query;

  const where = { status: "PUBLISHED" };
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (type) where.type = type;
  if (guests) where.maxGuests = { gte: guests };
  if (bedrooms) where.bedrooms = { gte: bedrooms };
  if (minPrice || maxPrice) {
    where.pricePerNight = {};
    if (minPrice) where.pricePerNight.gte = minPrice;
    if (maxPrice) where.pricePerNight.lte = maxPrice;
  }
  if (amenities) {
    const slugs = amenities.split(",").map((s) => s.trim());
    where.amenities = { some: { amenity: { slug: { in: slugs } } } };
  }

  const skip = (page - 1) * limit;

  let [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  if (checkIn && checkOut) {
    const availabilityChecks = await Promise.all(
      properties.map((p) => isDateRangeAvailable(p.id, checkIn, checkOut)),
    );
    properties = properties.filter((_, i) => availabilityChecks[i]);
  }

  return {
    properties,
    pagination: buildPagination(total, page, limit, properties.length),
  };
};

export const getPublicPropertyById = async (idOrSlug) => {
  const property = await prisma.property.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], status: "PUBLISHED" },
    include: propertyInclude,
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  return property;
};

export const getPropertyCalendarPublic = async (propertyId, from, to) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: "PUBLISHED" },
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  return getPropertyCalendar(propertyId, from, to);
};

export const blockPropertyDates = async (
  propertyId,
  hostId,
  { startDate, endDate, reason },
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);

  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError(
      "startDate must be before endDate",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const available = await isDateRangeAvailable(propertyId, startDate, endDate);
  if (!available) {
    throw new AppError(
      "These dates overlap an existing booking or block",
      STATUS_CODES.CONFLICT,
    );
  }

  return prisma.propertyBlockedDate.create({
    data: {
      propertyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    },
  });
};

export const attachPropertyImages = async (propertyId, hostId, uploadIds) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);

  const uploads = await prisma.upload.findMany({
    where: { id: { in: uploadIds }, userId: hostId },
  });
  if (uploads.length !== uploadIds.length) {
    throw new AppError(
      "One or more uploads not found or not owned by you",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const existingCount = await prisma.propertyImage.count({
    where: { propertyId },
  });

  const created = await prisma.propertyImage.createMany({
    data: uploadIds.map((uploadId, index) => ({
      propertyId,
      uploadId,
      sortOrder: existingCount + index,
      isCover: existingCount === 0 && index === 0,
    })),
  });

  return prisma.propertyImage.findMany({
    where: { propertyId },
    include: { upload: true },
    orderBy: { sortOrder: "asc" },
  });
};

export const setCoverImage = async (propertyId, imageId, hostId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);

  const image = await prisma.propertyImage.findFirst({
    where: { id: imageId, propertyId },
  });
  if (!image)
    throw new AppError(
      "Image not found on this property",
      STATUS_CODES.NOT_FOUND,
    );

  await prisma.$transaction([
    prisma.propertyImage.updateMany({
      where: { propertyId },
      data: { isCover: false },
    }),
    prisma.propertyImage.update({
      where: { id: imageId },
      data: { isCover: true },
    }),
  ]);

  return prisma.propertyImage.findMany({
    where: { propertyId },
    include: { upload: true },
    orderBy: { sortOrder: "asc" },
  });
};

export const deletePropertyImage = async (propertyId, imageId, hostId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  if (property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);

  const image = await prisma.propertyImage.findFirst({
    where: { id: imageId, propertyId },
  });
  if (!image)
    throw new AppError(
      "Image not found on this property",
      STATUS_CODES.NOT_FOUND,
    );

  await prisma.propertyImage.delete({ where: { id: imageId } });

  if (image.isCover) {
    const next = await prisma.propertyImage.findFirst({
      where: { propertyId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.propertyImage.update({
        where: { id: next.id },
        data: { isCover: true },
      });
    }
  }
};

// ── ADMIN ──────────────────────────────

/**
 * @param {{ page?: number, limit?: number, status?: string, city?: string, type?: string, hostId?: string  }} [query]
 */

export const adminListProperties = async ({
  page = 1,
  limit = 20,
  status,
  city,
  type,
  hostId,
} = {}) => {
  const where = {};
  if (status) where.status = status;
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (type) where.type = type;
  if (hostId) where.hostId = hostId;

  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties,
    pagination: buildPagination(total, page, limit, properties.length),
  };
};

export const adminGetPropertyById = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: propertyInclude,
  });

  if (!property) {
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);
  }

  return property;
};

export const adminUpdatePropertyStatus = async (
  propertyId,
  { status, rejectionReason },
  adminUser,
) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property)
    throw new AppError("Property not found", STATUS_CODES.NOT_FOUND);

  if (status === "REJECTED" && !rejectionReason) {
    throw new AppError(
      "rejectionReason is required when rejecting a property",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      publishedAt: status === "PUBLISHED" ? new Date() : property.publishedAt,
    },
  });

  await logActivity({
    type: "PROPERTY_STATUS_CHANGED",
    description: `Property "${property.title}" status changed to ${status} by admin`,
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    targetId: propertyId,
    metadata: {
      oldStatus: property.status,
      newStatus: status,
      rejectionReason,
    },
  });

  return updated;
};
