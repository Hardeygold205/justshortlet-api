import { Router } from "express";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
} from "../../middlewares/rateLimit.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  socialLoginSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
  emailOtpRequestSchema,
  emailOtpVerifySchema,
} from "../../schema/auth.schema.js";
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPasswordHandler,
  requestPhoneOtpHandler,
  socialLoginHandler,
  verifyPhoneOtpHandler,
  verifyEmailOtpHandler,
  requestEmailOtpHandler,
} from "./auth.controller.js";

const router = Router();

router.post("/register", registerLimiter, validate(registerSchema), register);

router.post("/login", loginLimiter, validate(loginSchema), login);

router.post(
  "/social-login",
  loginLimiter,
  validate(socialLoginSchema),
  socialLoginHandler,
);

router.post(
  "/refresh",
  refreshLimiter,
  validate(refreshTokenSchema),
  refreshToken,
);

router.post("/logout", authenticate, logout);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  resetPasswordHandler,
);

router.post(
  "/phone-otp/request",
  forgotPasswordLimiter,
  validate(phoneOtpRequestSchema),
  requestPhoneOtpHandler,
);

router.post(
  "/phone-otp/verify",
  resetPasswordLimiter,
  validate(phoneOtpVerifySchema),
  verifyPhoneOtpHandler,
);

router.post(
  "/email-otp/request",
  forgotPasswordLimiter,
  validate(emailOtpRequestSchema),
  requestEmailOtpHandler,
);

router.post(
  "/email-otp/verify",
  resetPasswordLimiter,
  validate(emailOtpVerifySchema),
  verifyEmailOtpHandler,
);

export default router;
