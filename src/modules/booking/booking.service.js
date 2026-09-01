import { prisma } from "../../config/prisma.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { isDateRangeAvailable } from "../../services/availability.service.js";
import { logActivity } from "../activity/activity.service.js";

const buildPagination = (total, page, limit, resultCount) => ({
  total,
  totalPages: Math.ceil(total / limit),
  currentPage: page,
  limit,
  hasNextPage: (page - 1) * limit + resultCount < total,
  hasPrevPage: page > 1,
});

const bookingInclude = {
  property: {
    select: {
      id: true,
      title: true,
      slug: true,
      city: true,
      state: true,
      hostId: true,
      images: {
        where: { isCover: true },
        take: 1,
        include: { upload: { select: { url: true } } },
      },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
};

const calculateNights = (checkIn, checkOut) => {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const calculatePricing = (property, nights) => {
  let subtotal = Number(property.pricePerNight) * nights;

  if (nights >= 28 && property.monthlyDiscountPercent) {
    subtotal -= subtotal * (Number(property.monthlyDiscountPercent) / 100);
  } else if (nights >= 7 && property.weeklyDiscountPercent) {
    subtotal -= subtotal * (Number(property.weeklyDiscountPercent) / 100);
  }

  const cleaningFee = Number(property.cleaningFee ?? 0);
  const serviceFee = subtotal * (Number(property.serviceFeePercent) / 100);
  const total = subtotal + serviceFee + cleaningFee;

  return {
    pricePerNight: property.pricePerNight,
    cleaningFee,
    serviceFeePercent: property.serviceFeePercent,
    subtotal: Math.round(subtotal * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

export const createBooking = async (guestId, data) => {
  const { propertyId, checkIn, checkOut, guests, guestNote } = data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property || property.status !== "PUBLISHED") {
    throw new AppError(
      "Property not found or not available for booking",
      STATUS_CODES.NOT_FOUND,
    );
  }

  if (property.hostId === guestId) {
    throw new AppError(
      "You cannot book your own property",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (guests > property.maxGuests) {
    throw new AppError(
      `This property allows a maximum of ${property.maxGuests} guests`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights < property.minNights) {
    throw new AppError(
      `Minimum stay is ${property.minNights} night(s)`,
      STATUS_CODES.BAD_REQUEST,
    );
  }
  if (property.maxNights && nights > property.maxNights) {
    throw new AppError(
      `Maximum stay is ${property.maxNights} night(s)`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const pricing = calculatePricing(property, nights);
  const status = property.instantBooking ? "CONFIRMED" : "PENDING";

  // Serializable transaction: re-check availability and create atomically,
  // so two concurrent requests for the same dates can't both succeed.
  const booking = await prisma.$transaction(
    async (tx) => {
      const available = await isDateRangeAvailable(
        propertyId,
        checkIn,
        checkOut,
      );
      if (!available) {
        throw new AppError(
          "These dates are no longer available",
          STATUS_CODES.CONFLICT,
        );
      }

      return tx.booking.create({
        data: {
          propertyId,
          userId: guestId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          nights,
          guests,
          guestNote,
          status,
          confirmedAt: status === "CONFIRMED" ? new Date() : null,
          ...pricing,
        },
        include: bookingInclude,
      });
    },
    { isolationLevel: "Serializable" },
  );

  await logActivity({
    type: "BOOKING_CREATED",
    description: `Booking created for "${property.title}" (${nights} night${nights > 1 ? "s" : ""})`,
    actorId: guestId,
    targetId: booking.id,
    metadata: { propertyId, status },
  });

  return booking;
};

/**
 * @param {string} guestId
 * @param {{ page?: number, limit?: number, status?: string }} [query]
 */

export const getMyBookings = async (
  guestId,
  { page = 1, limit = 20, status } = {},
) => {
  const where = { userId: guestId, ...(status && { status }) };
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: buildPagination(total, page, limit, bookings.length),
  };
};

export const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
  if (!booking) throw new AppError("Booking not found", STATUS_CODES.NOT_FOUND);

  const isGuest = booking.userId === userId;
  const isHost = booking.property.hostId === userId;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (!isGuest && !isHost && !isAdmin) {
    throw new AppError(
      "Not authorized to view this booking",
      STATUS_CODES.FORBIDDEN,
    );
  }

  return booking;
};

export const cancelBooking = async (bookingId, userId, userRole, reason) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });
  if (!booking) throw new AppError("Booking not found", STATUS_CODES.NOT_FOUND);

  const isGuest = booking.userId === userId;
  const isHost = booking.property.hostId === userId;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (!isGuest && !isHost && !isAdmin) {
    throw new AppError(
      "Not authorized to cancel this booking",
      STATUS_CODES.FORBIDDEN,
    );
  }

  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    throw new AppError(
      `Cannot cancel a booking with status ${booking.status}`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const cancelledBy = isAdmin ? "ADMIN" : isHost ? "HOST" : "GUEST";

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledBy,
      cancellationReason: reason,
      cancelledAt: new Date(),
    },
    include: bookingInclude,
  });

  await logActivity({
    type: "BOOKING_CANCELLED",
    description: `Booking cancelled by ${cancelledBy.toLowerCase()}`,
    actorId: userId,
    targetId: bookingId,
    metadata: { reason, propertyId: booking.propertyId },
  });

  return updated;
};

// ── HOST ──────────────────────────────

/**
 * @param {string} hostId
 * @param {{ page?: number, limit?: number, status?: string, propertyId?: string }} [query]
 */

export const getHostBookings = async (
  hostId,
  { page = 1, limit = 20, status, propertyId } = {},
) => {
  const where = {
    property: { hostId },
    ...(status && { status }),
    ...(propertyId && { propertyId }),
  };
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: buildPagination(total, page, limit, bookings.length),
  };
};

export const confirmBooking = async (bookingId, hostId, hostNote) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });
  if (!booking) throw new AppError("Booking not found", STATUS_CODES.NOT_FOUND);
  if (booking.property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);
  if (booking.status !== "PENDING") {
    throw new AppError(
      `Cannot confirm a booking with status ${booking.status}`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", hostNote, confirmedAt: new Date() },
    include: bookingInclude,
  });

  await logActivity({
    type: "BOOKING_CREATED", // reuse — no separate CONFIRMED type yet; consider adding BOOKING_CONFIRMED later
    description: `Booking confirmed by host`,
    actorId: hostId,
    targetId: bookingId,
  });

  return updated;
};

export const rejectBooking = async (bookingId, hostId, reason) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });
  if (!booking) throw new AppError("Booking not found", STATUS_CODES.NOT_FOUND);
  if (booking.property.hostId !== hostId)
    throw new AppError("Not authorized", STATUS_CODES.FORBIDDEN);
  if (booking.status !== "PENDING") {
    throw new AppError(
      `Cannot reject a booking with status ${booking.status}`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "REJECTED", hostNote: reason },
    include: bookingInclude,
  });

  await logActivity({
    type: "BOOKING_CANCELLED",
    description: `Booking rejected by host`,
    actorId: hostId,
    targetId: bookingId,
    metadata: { reason },
  });

  return updated;
};

// ── ADMIN ──────────────────────────────

/**
 * @param {{ page?: number, limit?: number, status?: string }} [query]
 */
export const adminListBookings = async ({
  page = 1,
  limit = 20,
  status,
} = {}) => {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: buildPagination(total, page, limit, bookings.length),
  };
};
