import jwt from "jsonwebtoken";
import ENV from "../config/env.js";

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
    const error = new Error("Invalid or expired access token");
    error.statusCode = 401;
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }
};
