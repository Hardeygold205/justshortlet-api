import { verifyAccessToken } from "../utils/jwt.js";
import { isTokenBlacklisted } from "../services/redis.service.js";
import { STATUS_CODES } from "../constants/statusCode.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Malformed token" });
    }

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Token has been revoked" });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: "Unauthorized" });
  }
};
