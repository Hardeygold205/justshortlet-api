import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createAdminSchema,
  updateAdminSchema,
  adminIdParamSchema,
} from "../../schema/admin.schema.js";
import {
  createAdminHandler,
  listAdminsHandler,
  getAdminHandler,
  updateAdminHandler,
  deleteAdminHandler,
} from "./admin.controller.js";

const router = Router();

router.use(authenticate, requireRole("SUPER_ADMIN"));

router.post("/", validate(createAdminSchema), createAdminHandler);
router.get("/", listAdminsHandler);
router.get("/:id", validate(adminIdParamSchema), getAdminHandler);
router.patch("/:id", validate(updateAdminSchema), updateAdminHandler);
router.delete("/:id", validate(adminIdParamSchema), deleteAdminHandler);

export default router;
