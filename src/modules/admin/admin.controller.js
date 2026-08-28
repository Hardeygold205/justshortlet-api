import {
  createAdmin,
  listAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "./admin.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const createAdminHandler = asyncHandler(async (req, res) => {
  const admin = await createAdmin(req.body, req.user.id);
  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Admin created successfully",
    admin,
  );
});

export const listAdminsHandler = asyncHandler(async (req, res) => {
  const admins = await listAdmins();
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Admins retrieved successfully",
    admins,
  );
});

export const getAdminHandler = asyncHandler(async (req, res) => {
  const admin = await getAdminById(req.params.id);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Admin retrieved successfully",
    admin,
  );
});

export const updateAdminHandler = asyncHandler(async (req, res) => {
  const admin = await updateAdmin(req.params.id, req.body, req.user.id);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Admin updated successfully",
    admin,
  );
});

export const deleteAdminHandler = asyncHandler(async (req, res) => {
  await deleteAdmin(req.params.id, req.user.id);
  return successResponse(res, STATUS_CODES.OK, "Admin deleted successfully");
});
