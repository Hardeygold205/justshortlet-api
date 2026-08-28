import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { checkMediaPermission } from "../../middlewares/mediaPermission.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  updateMeSchema,
  getUserByIdSchema,
  getUsersSchema,
  updateProfileMediaSchema,
  upgradeToHostSchema,
  changePasswordSchema,
  verifyPhoneSchema,
  requestVerifyPhoneSchema,
  verifyEmailSchema,
  requestVerifyEmailSchema,
  adminUpdateUserSchema,
} from "../../schema/user.schema.js";
import {
  updateMyProfileMedia,
  upgradeToHost,
  getMe,
  getOneUser,
  deleteOneUser,
  getUsers,
  updateMe,
  deleteMe,
  updatePassword,
  requestVerifyEmail,
  requestVerifyPhone,
  verifyEmail,
  verifyPhone,
  adminUpdateUserHandler,
} from "./user.controller.js";
import { uploadImageMemory } from "../../config/multer.js";
import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
  updatePasswordLimiter,
} from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.patch(
  "/me/profile/:type",
  authenticate,
  validate(updateProfileMediaSchema),
  checkMediaPermission,
  (req, res, next) => {
    uploadImageMemory.single("file")(req, res, (err) => {
      if (err)
        return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  updateMyProfileMedia,
);

router.post(
  "/me/upgrade-to-host",
  authenticate,
  validate(upgradeToHostSchema),
  upgradeToHost,
);

router.get("/", validate(getUsersSchema), getUsers);
router.get("/me", authenticate, getMe);
router.get("/:userId", validate(getUserByIdSchema), getOneUser);

router.delete("/:userId", validate(getUserByIdSchema), deleteOneUser);

router.patch("/me", authenticate, validate(updateMeSchema), updateMe);
router.delete("/me", authenticate, deleteMe);

router.post(
  "/me/verify-email/request",
  authenticate,
  forgotPasswordLimiter,
  validate(requestVerifyEmailSchema),
  requestVerifyEmail,
);

router.post(
  "/me/verify-email/verify",
  authenticate,
  resetPasswordLimiter,
  validate(verifyEmailSchema),
  verifyEmail,
);

router.post(
  "/me/verify-phone/request",
  authenticate,
  forgotPasswordLimiter,
  validate(requestVerifyPhoneSchema),
  requestVerifyPhone,
);

router.post(
  "/me/verify-phone/verify",
  authenticate,
  resetPasswordLimiter,
  validate(verifyPhoneSchema),
  verifyPhone,
);

router.patch(
  "/me/update-password",
  authenticate,
  updatePasswordLimiter,
  validate(changePasswordSchema),
  updatePassword,
);

router.patch(
  "/:userId",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(adminUpdateUserSchema),
  adminUpdateUserHandler,
);

export default router;
