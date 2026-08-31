// amenity.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as controller from "./amenity.controller.js";
import * as schema from "../../schema/amenity.schema.js";

const router = Router();

router.get("/", controller.listAmenitiesHandler);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(schema.createAmenitySchema),
  controller.createAmenityHandler,
);

router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(schema.updateAmenitySchema),
  controller.updateAmenityHandler,
);

router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(schema.amenityIdParamSchema),
  controller.deleteAmenityHandler,
);

export default router;
