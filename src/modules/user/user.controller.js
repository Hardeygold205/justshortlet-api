import {
  getCurrentUser,
  getUserById,
  getAllUsers,
  updateCurrentUser,
  updateProfileMedia,
  deleteCurrentUser,
  upgradeGuestToHost,
  changePassword,
  deleteUserById,
  adminUpdateUser,
} from "./user.service.js";
import AppError from "../../utils/AppError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";
import { uploadProfileMedia } from "../../services/media.service.js";
import {
  requestVerifyEmailAdd,
  requestVerifyPhoneAdd,
  verifyEmailAdd,
  verifyPhoneAdd,
} from "../auth/auth.service.js";

export const updateMyProfileMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", STATUS_CODES.BAD_REQUEST);
  }

  const { type } = req.params;
  const currentUser = await getCurrentUser(req.user.id);

  const oldPath =
    type === "avatar"
      ? currentUser?.profile?.avatarPath
      : currentUser?.profile?.bannerPath;

  const { url, thumbnailUrl, path } = await uploadProfileMedia(
    type,
    req.file.buffer,
    req.user.id,
    req.file.mimetype,
    oldPath,
  );

  const updateData =
    type === "avatar"
      ? { avatarUrl: url, thumbnailUrl, avatarPath: path }
      : { bannerUrl: url, bannerThumbnailUrl: thumbnailUrl, bannerPath: path };

  const updatedUser = await updateProfileMedia(req.user.id, updateData);

  return successResponse(
    res,
    STATUS_CODES.OK,
    `${type} updated successfully`,
    updatedUser,
  );
});

export const upgradeToHost = asyncHandler(async (req, res) => {
  const result = await upgradeGuestToHost(req.user.id);

  return successResponse(
    res,
    STATUS_CODES.OK,
    "Upgraded to HOST successfully",
    result,
  );
});

export const adminUpdateUserHandler = asyncHandler(async (req, res) => {
  const updated = await adminUpdateUser(req.params.userId, req.body, req.user);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "User updated successfully",
    updated,
  );
});

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

export const deleteOneUser = asyncHandler(async (req, res) => {
  await deleteUserById(req.validated.params.userId);
  return successResponse(res, STATUS_CODES.OK, "User deleted successfully");
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

export const requestVerifyEmail = asyncHandler(async (req, res) => {
  await requestVerifyEmailAdd(req.user.id, req.body.email);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Verification code sent to email",
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await verifyEmailAdd(req.user.id, req.body.email, req.body.code);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Email verified and added",
    user,
  );
});

export const requestVerifyPhone = asyncHandler(async (req, res) => {
  await requestVerifyPhoneAdd(req.user.id, req.body.phone);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Verification code sent to phone",
  );
});

export const verifyPhone = asyncHandler(async (req, res) => {
  const user = await verifyPhoneAdd(req.user.id, req.body.phone, req.body.code);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Phone verified and added",
    user,
  );
});

export const updatePassword = asyncHandler(async (req, res) => {
  await changePassword(req.user.id, req.body);

  return successResponse(res, STATUS_CODES.OK, "Password updated successfully");
});
