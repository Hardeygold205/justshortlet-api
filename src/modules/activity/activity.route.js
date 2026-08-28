import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  listActivitiesSchema,
  userActivitiesSchema,
} from "../../schema/activity.schema.js";
import {
  listActivitiesHandler,
  getUserActivitiesHandler,
} from "./activity.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(listActivitiesSchema),
  listActivitiesHandler,
);

router.get(
  "/user/:userId",
  authenticate,
  validate(userActivitiesSchema),
  getUserActivitiesHandler,
);

export default router;
