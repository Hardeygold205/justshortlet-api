export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  INTERNAL_SERVER_ERROR: 500,
};

export const STATUS_MESSAGES = {
  OK: "Request successful",
  CREATED: "Resource created successfully",
  ACCEPTED: "Request accepted",
  NO_CONTENT: "No content",

  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource already exists or conflicts with existing data",
  UNPROCESSABLE_ENTITY: "Validation failed",

  INTERNAL_SERVER_ERROR: "Internal server error",
};
