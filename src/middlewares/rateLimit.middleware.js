import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, try again later",
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many registration attempts, try again later",
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts, try again later",
  },
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${req.body?.email?.toLowerCase() || ""}`,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many requests, try again later" },
});

export const updatePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password change attempts, try again later",
  },
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.userId || ""}`,
});

const getIdentifier = (req) =>
  (req.body?.email || req.body?.phone || "").toLowerCase();

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many reset requests, try again later",
  },
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${getIdentifier(req)}`,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many attempts, try again later" },
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${getIdentifier(req)}`,
});
