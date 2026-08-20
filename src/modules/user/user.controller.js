import {
  getCurrentUser,
  getUserById,
  getAllUsers,
  updateCurrentUser,
  deleteCurrentUser,
} from "./user.service.js";
import AppError from "../../utils/AppError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const getMe = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Current user fetched successfully",
    user,
  );
});

export const getOneUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.validated.params.userId);

  if (!user) {
    throw new AppError("User not found", STATUS_CODES.NOT_FOUND);
  }

  return successResponse(
    res,
    STATUS_CODES.OK,
    "User fetched successfully",
    user,
  );
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.validated.query;
  const result = await getAllUsers({ page, limit, search });

  return successResponse(
    res,
    STATUS_CODES.OK,
    "Users fetched successfully",
    result,
  );
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await updateCurrentUser(req.user.id, req.validated.body);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Profile updated successfully",
    user,
  );
});

export const deleteMe = asyncHandler(async (req, res) => {
  await deleteCurrentUser(req.user.id);
  return successResponse(res, STATUS_CODES.OK, "User deleted successfully");
});
