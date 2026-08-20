import redis from "../config/redis.js";

export const addTokenToBlacklist = async (token, expiresInSeconds) => {
  await redis.set(token, "blacklisted", { EX: expiresInSeconds });
};

export const isTokenBlacklisted = async (token) => {
  const result = await redis.get(token);
  return result === "blacklisted";
};

export const setRefreshToken = async (userId, token) => {
  const SEVEN_DAYS = 7 * 24 * 60 * 60;
  await redis.set(`refresh:${userId}`, token, { EX: SEVEN_DAYS });
};

export const getRefreshToken = async (userId) => {
  return redis.get(`refresh:${userId}`);
};

export const deleteRefreshToken = async (userId) => {
  await redis.del(`refresh:${userId}`);
};