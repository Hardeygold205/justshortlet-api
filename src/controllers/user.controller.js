import {
  getCurrentUser,
  getUserById,
  getAllUsers,
  updateCurrentUser,
  deleteCurrentUser,
} from "../services/user.service.js";
import AppError from "../utils/AppError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { successResponse } from "../utils/response.js";

export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);

    return successResponse(
      res,
      STATUS_CODES.OK,
      "Current user fetched successfully",
      user,
    );
  } catch (error) {
    next(error);
  }
};

export const getOneUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.validated.params.id);

    if (!user) {
      throw new AppError("User not found", STATUS_CODES.NOT_FOUND);
    }

    return successResponse(
      res,
      STATUS_CODES.OK,
      "User fetched successfully",
      user,
    );
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.validated.query;

    const result = await getAllUsers({ page, limit, search });

    return successResponse(
      res,
      STATUS_CODES.OK,
      "Users fetched successfully",
      result,
    );
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await updateCurrentUser(req.user.id, req.validated.body);

    return successResponse(
      res,
      STATUS_CODES.OK,
      "Profile updated successfully",
      user,
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await deleteCurrentUser(req.user.id);

    return successResponse(res, STATUS_CODES.OK, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};
