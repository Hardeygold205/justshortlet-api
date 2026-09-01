import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as schema from "../../schema/booking.schema.js";
import * as controller from "./booking.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("HOST"),
  validate(schema.listBookingsSchema),
  controller.getHostBookingsHandler,
);

router.post(
  "/:id/confirm",
  authenticate,
  requireRole("HOST"),
  validate(schema.confirmBookingSchema),
  controller.confirmBookingHandler,
);

router.post(
  "/:id/reject",
  authenticate,
  requireRole("HOST"),
  validate(schema.rejectBookingSchema),
  controller.rejectBookingHandler,
);

export default router;
