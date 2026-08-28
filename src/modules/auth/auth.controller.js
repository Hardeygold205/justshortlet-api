import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  socialLogin,
  requestPasswordReset,
  resetPassword,
  requestPhoneOtp,
  verifyPhoneOtp,
  verifyEmailOtp,
  requestEmailOtp,
} from "./auth.service.js";
import AppError from "../../utils/AppError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Registered successfully",
    result,
  );
});

export const socialLoginHandler = asyncHandler(async (req, res) => {
  const { provider, token } = req.body;
  const result = await socialLogin(provider, token);
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

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  return successResponse(res, STATUS_CODES.OK, "Login successful", result);
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

export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset(req.body.email);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "If an account exists with that email, a reset code has been sent.",
  );
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  return successResponse(res, STATUS_CODES.OK, "Password reset successfully");
});

export const requestPhoneOtpHandler = asyncHandler(async (req, res) => {
  await requestPhoneOtp(req.body.phone);
  return successResponse(res, STATUS_CODES.OK, "OTP sent");
});

export const verifyPhoneOtpHandler = asyncHandler(async (req, res) => {
  const result = await verifyPhoneOtp(req.body.phone, req.body.code);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Phone OTP verified successful",
    result,
  );
});

export const requestEmailOtpHandler = asyncHandler(async (req, res) => {
  await requestEmailOtp(req.body.email);
  return successResponse(res, STATUS_CODES.OK, "OTP sent");
});

export const verifyEmailOtpHandler = asyncHandler(async (req, res) => {
  const result = await verifyEmailOtp(req.body.email, req.body.code);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Email OTP verified successful",
    result,
  );
});
