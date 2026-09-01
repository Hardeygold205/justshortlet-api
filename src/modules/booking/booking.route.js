import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as schema from "../../schema/booking.schema.js";
import * as controller from "./booking.controller.js";

const router = Router();

// ── Guest ──────────────────────────────
router.post(
  "/",
  authenticate,
  validate(schema.createBookingSchema),
  controller.createBookingHandler,
);

router.get(
  "/",
  authenticate,
  validate(schema.listBookingsSchema),
  controller.getMyBookingsHandler,
);

router.get(
  "/:id",
  authenticate,
  validate(schema.bookingIdParamSchema),
  controller.getBookingHandler,
);

router.post(
  "/:id/cancel",
  authenticate,
  validate(schema.cancelBookingSchema),
  controller.cancelBookingHandler,
);

export default router;
