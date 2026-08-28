// @ts-nocheck
import { verifyAccessToken } from "../utils/jwt.js";
import {
  isTokenBlacklisted,
  getCachedUser,
  setCachedUser,
} from "../services/redis.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { prisma } from "../config/prisma.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("No token provided", STATUS_CODES.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError("Malformed token", STATUS_CODES.UNAUTHORIZED);
  }

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    throw new AppError("Token has been revoked", STATUS_CODES.UNAUTHORIZED);
  }

  const decoded = verifyAccessToken(token);

  const cacheKey = `auth:${decoded.id}`;
  let userShell = await getCachedUser(cacheKey);

  if (!userShell) {
    userShell = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!userShell) {
      return next(new AppError("User not found", STATUS_CODES.UNAUTHORIZED));
    }
    await setCachedUser(cacheKey, userShell);
  }

  if (userShell.status === "SUSPENDED") {
    return next(
      new AppError(
        "Your account has been suspended. Contact support.",
        STATUS_CODES.FORBIDDEN,
      ),
    );
  }

  req.user = {
    id: userShell.id,
    email: userShell.email,
    role: userShell.role,
    status: userShell.status,
  };

  next();
});
