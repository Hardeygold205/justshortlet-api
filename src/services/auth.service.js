import pool from "../config/db.js";
import redis from "../config/redis.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const REFRESH_EXPIRES_SECONDS = 7 * 24 * 60 * 60;

export const registerUser = async (payload) => {
  const { email, password, first_name, last_name, username } = payload;

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1",
    [email, username || null],
  );

  if (existingUser.rows.length > 0) {
    const error = new Error("Email or username already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const { rows } = await pool.query(
    `
      INSERT INTO users (email, password, first_name, last_name, username)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, username, provider, role, created_at
    `,
    [
      email,
      hashedPassword,
      first_name || null,
      last_name || null,
      username || null,
    ],
  );

  const user = rows[0];

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await redis.set(
    `refresh:${user.id}`,
    refreshToken,
    "EX",
    REFRESH_EXPIRES_SECONDS,
  );

  return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email],
  );

  const user = rows[0];

  if (!user || !user.password) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await redis.set(
    `refresh:${user.id}`,
    refreshToken,
    "EX",
    REFRESH_EXPIRES_SECONDS,
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      provider: user.provider,
      role: user.role,
      created_at: user.created_at,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshUserToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);

  const storedToken = await redis.get(`refresh:${decoded.id}`);

  if (!storedToken || storedToken !== refreshToken) {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  const newAccessToken = generateAccessToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  });

  return { accessToken: newAccessToken };
};

export const logoutUser = async (userId) => {
  await redis.del(`refresh:${userId}`);
  return true;
};
