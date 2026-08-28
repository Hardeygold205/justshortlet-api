import AppError from "../utils/AppError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { PROFILE_MEDIA_PERMISSIONS } from "../constants/upload.js";

export const checkMediaPermission = (req, res, next) => {
  const { type } = req.params;
  const allowedRoles = PROFILE_MEDIA_PERMISSIONS[type];

  if (!allowedRoles) {
    throw new AppError(
      `Unsupported media type: ${type}`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (!allowedRoles.includes(req.user.role)) {
    throw new AppError(
      `Your role (${req.user.role}) is not permitted to upload a ${type}`,
      STATUS_CODES.FORBIDDEN,
    );
  }

  next();
};
