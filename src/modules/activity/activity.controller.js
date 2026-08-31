import {
  getAllActivities,
  getActivitiesByUserId,
} from "../activity/activity.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const listActivitiesHandler = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    category,
    type,
    timeframe,
    from,
    to,
    actorId,
    targetId,
  } = req.validatedQuery;

  const result = await getAllActivities({
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
    category,
    type,
    timeframe,
    from,
    to,
    actorId,
    targetId,
  });

  return successResponse(
    res,
    STATUS_CODES.OK,
    "Activities fetched successfully",
    result,
  );
});

export const getUserActivitiesHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const isSelf = req.user.id === userId;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(req.user.role);

  if (!isSelf && !isAdmin) {
    throw new AppError(
      "You don't have permission to view these activities",
      STATUS_CODES.FORBIDDEN,
    );
  }

  const result = await getActivitiesByUserId(userId, req.validatedQuery);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Activities fetched successfully",
    result,
  );
});
