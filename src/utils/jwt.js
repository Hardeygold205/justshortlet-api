import jwt from "jsonwebtoken";
import ENV from "../config/env.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" });
};
