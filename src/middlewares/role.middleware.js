import AppError from "../utils/AppError.js";
import { STATUS_CODES } from "../constants/statusCode.js";

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You don't have permission to access this resource",
          STATUS_CODES.FORBIDDEN,
        ),
      );
    }
    next();
  };
