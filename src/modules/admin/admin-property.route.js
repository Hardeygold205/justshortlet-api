import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as schema from "../../schema/property.schema.js";
import * as controller from "../property/property.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(schema.adminListPropertiesSchema),
  controller.adminListPropertiesHandler,
);

router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(schema.adminUpdateStatusSchema),
  controller.adminUpdateStatusHandler,
);

export default router;
