import { STATUS_CODES, STATUS_MESSAGES } from "../constants/statusCode.js";
import { errorResponse } from "../utils/response.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  const message = err.message || STATUS_MESSAGES.INTERNAL_SERVER_ERROR;

  if (
    !(err instanceof Error) ||
    statusCode === STATUS_CODES.INTERNAL_SERVER_ERROR
  ) {
    console.error("Unhandled error:", err);
  }

  return errorResponse(res, statusCode, message, err.errors || null);
};

export default errorHandler;
