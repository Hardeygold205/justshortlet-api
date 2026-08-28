import { prisma } from "../config/prisma.js";

/**
 * Returns true if the given date range is free for this property —
 * checks both confirmed/pending bookings AND host-blocked dates.
 */
export const isDateRangeAvailable = async (
  propertyId,
  checkIn,
  checkOut,
  excludeBookingId = null,
) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
    select: { id: true },
  });

  if (overlappingBooking) return false;

  const overlappingBlock = await prisma.propertyBlockedDate.findFirst({
    where: {
      propertyId,
      startDate: { lt: checkOutDate },
      endDate: { gt: checkInDate },
    },
    select: { id: true },
  });

  return !overlappingBlock;
};

/**
 * Returns an array of booked/blocked date ranges for a property —
 * used to render the calendar UI (grey out unavailable dates).
 */
export const getPropertyCalendar = async (propertyId, from, to) => {
  const fromDate = from ? new Date(from) : new Date();
  const toDate = to
    ? new Date(to)
    : new Date(fromDate.getFullYear(), fromDate.getMonth() + 6, 1);

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { lt: toDate },
        checkOut: { gt: fromDate },
      },
      select: { checkIn: true, checkOut: true, status: true },
    }),
    prisma.propertyBlockedDate.findMany({
      where: {
        propertyId,
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
      select: { startDate: true, endDate: true, reason: true },
    }),
  ]);

  return {
    unavailable: [
      ...bookings.map((b) => ({
        start: b.checkIn,
        end: b.checkOut,
        reason: "booked",
      })),
      ...blocks.map((b) => ({
        start: b.startDate,
        end: b.endDate,
        reason: b.reason || "blocked",
      })),
    ],
  };
};
