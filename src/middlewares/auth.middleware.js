import jwt from "jsonwebtoken";
import ENV from "../config/env.js";
import { STATUS_CODES, STATUS_MESSAGES } from "../constants/statusCode.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: "Unauthorized" });
  }
};
