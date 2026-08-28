// @ts-nocheck
import jwt from "jsonwebtoken";
import ENV from "../config/env.js";
import AppError from "./AppError.js";
import { STATUS_CODES } from "../constants/statusCode.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(
      "Invalid or expired access token",
      STATUS_CODES.UNAUTHORIZED,
    );
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(
      "Invalid or expired refresh token",
      STATUS_CODES.UNAUTHORIZED,
    );
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};

export const getTokenRemainingSeconds = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;

  const remaining = decoded.exp - Math.floor(Date.now() / 1000);
  return remaining > 0 ? remaining : 0;
};
