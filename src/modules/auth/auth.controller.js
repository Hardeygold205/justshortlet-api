import {
  exchangeSupabaseToken as exchangeToken,
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
} from "./auth.service.js";
import AppError from "../../utils/AppError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const exchangeSupabaseToken = asyncHandler(async (req, res) => {
  const { supabaseAccessToken } = req.body;
  const result = await exchangeToken(supabaseAccessToken);

  return successResponse(
    res,
    STATUS_CODES.OK,
    "Token exchanged successfully",
    result,
  );
});

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Registered successfully",
    result,
  );
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  return successResponse(res, STATUS_CODES.OK, "Login successful", result);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await refreshUserToken(refreshToken);

  return successResponse(
    res,
    STATUS_CODES.OK,
    "Token refreshed successfully",
    result,
  );
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError(
      "Authorization token required",
      STATUS_CODES.UNAUTHORIZED,
    );
  }

  await logoutUser(req.user.id, token);

  return successResponse(res, STATUS_CODES.OK, "Logged out successfully");
});
