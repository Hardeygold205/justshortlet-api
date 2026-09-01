import * as bookingService from "./booking.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const createBookingHandler = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Booking created successfully",
    booking,
  );
});

export const getMyBookingsHandler = asyncHandler(async (req, res) => {
  const result = await bookingService.getMyBookings(
    req.user.id,
    req.validatedQuery,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Bookings fetched successfully",
    result,
  );
});

export const getBookingHandler = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user.id,
    req.user.role,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Booking fetched successfully",
    booking,
  );
});

export const cancelBookingHandler = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body.reason,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Booking cancelled successfully",
    booking,
  );
});

// ── Host ──────────────────────────────
export const getHostBookingsHandler = asyncHandler(async (req, res) => {
  const result = await bookingService.getHostBookings(
    req.user.id,
    req.validatedQuery,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Bookings fetched successfully",
    result,
  );
});

export const confirmBookingHandler = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirmBooking(
    req.params.id,
    req.user.id,
    req.body.hostNote,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Booking confirmed successfully",
    booking,
  );
});

export const rejectBookingHandler = asyncHandler(async (req, res) => {
  const booking = await bookingService.rejectBooking(
    req.params.id,
    req.user.id,
    req.body.reason,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Booking rejected successfully",
    booking,
  );
});

// ── Admin ──────────────────────────────
export const adminListBookingsHandler = asyncHandler(async (req, res) => {
  const result = await bookingService.adminListBookings(req.validatedQuery);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Bookings fetched successfully",
    result,
  );
});
