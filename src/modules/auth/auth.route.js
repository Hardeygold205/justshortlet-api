import { Router } from "express";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  supabaseExchangeSchema,
} from "../../schema/auth.schema.js";
import {
  exchangeSupabaseToken,
  register,
  login,
  refreshToken,
  logout,
} from "./auth.controller.js";

const router = Router();

router.post(
  "/supabase-exchange",
  validate(supabaseExchangeSchema),
  exchangeSupabaseToken,
);

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", validate(refreshTokenSchema), refreshToken);

router.post("/logout", authenticate, logout);

export default router;
