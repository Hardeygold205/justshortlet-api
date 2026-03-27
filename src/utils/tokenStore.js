import redis from "../config/redis.js";

export const addTokenToBlacklist = async (token, expiresInSeconds) => {
  await redis.set(token, "blacklisted", { EX: expiresInSeconds });
};

export const isTokenBlacklisted = async (token) => {
  const result = await redis.get(token);
  return result === "blacklisted";
};
