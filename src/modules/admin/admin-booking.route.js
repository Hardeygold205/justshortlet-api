import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as schema from "../../schema/booking.schema.js";
import * as controller from "../booking/booking.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(schema.listBookingsSchema),
  controller.adminListBookingsHandler,
);

export default router;
