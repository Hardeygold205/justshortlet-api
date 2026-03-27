import express from "express";
import validate from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../schema/auth.schema.js";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);
router.post("/logout", authenticate, logout);

export default router;
