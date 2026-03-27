import { STATUS_CODES, STATUS_MESSAGES } from "../constants/statusCode.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({
    success: false,
    message: err.message || STATUS_MESSAGES.INTERNAL_SERVER_ERROR,
    errors: err.errors || null,
  });
};

export default errorHandler;
