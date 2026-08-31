import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as schema from "../../schema/property.schema.js";
import * as controller from "./property.controller.js";

const router = Router();

// ── Public ──────────────────────────────
router.get(
  "/",
  validate(schema.listPropertiesSchema),
  controller.listPublicPropertiesHandler,
);

router.get(
  "/:id",
  validate(schema.publicPropertyParamSchema),
  controller.getPublicPropertyHandler,
);

router.get(
  "/:id/calendar",
  validate(schema.calendarQuerySchema),
  controller.getCalendarHandler,
);

// ── Host ──────────────────────────────
router.post(
  "/mine",
  authenticate,
  requireRole("HOST"),
  validate(schema.createPropertySchema),
  controller.createPropertyHandler,
);

router.get(
  "/mine/list",
  authenticate,
  requireRole("HOST"),
  controller.getMyPropertiesHandler,
);

router.get(
  "/mine/:id",
  authenticate,
  requireRole("HOST"),
  validate(schema.propertyIdParamSchema),
  controller.getMyPropertyHandler,
);

router.patch(
  "/mine/:id",
  authenticate,
  requireRole("HOST"),
  validate(schema.updatePropertySchema),
  controller.updatePropertyHandler,
);

router.delete(
  "/mine/:id",
  authenticate,
  requireRole("HOST"),
  validate(schema.propertyIdParamSchema),
  controller.deletePropertyHandler,
);

router.post(
  "/mine/:id/submit",
  authenticate,
  requireRole("HOST"),
  validate(schema.propertyIdParamSchema),
  controller.submitPropertyHandler,
);

router.post(
  "/mine/:id/block-dates",
  authenticate,
  requireRole("HOST"),
  validate(schema.blockDatesSchema),
  controller.blockDatesHandler,
);

router.post(
  "/mine/:id/images",
  authenticate,
  requireRole("HOST"),
  validate(schema.attachImagesSchema),
  controller.attachImagesHandler,
);

router.patch(
  "/mine/:id/images/:imageId/cover",
  authenticate,
  requireRole("HOST"),
  validate(schema.setCoverImageSchema),
  controller.setCoverImageHandler,
);

router.delete(
  "/mine/:id/images/:imageId",
  authenticate,
  requireRole("HOST"),
  validate(schema.deletePropertyImageSchema),
  controller.deletePropertyImageHandler,
);

export default router;
