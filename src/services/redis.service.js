// @ts-nocheck
import ENV from "../config/env.js";
import redis from "../config/redis.js";

// TOKEN BLACKLIST

const blacklistKey = (token) => `blacklist:${token}`;

export const addTokenToBlacklist = async (token, expiresInSeconds) => {
  await redis.set(blacklistKey(token), "true", { EX: expiresInSeconds });
};

export const isTokenBlacklisted = async (token) => {
  const result = await redis.get(blacklistKey(token));
  return result === "true";
};

// REFRESH TOKENS

const refreshTokenKey = (userId) => `refresh:${userId}`;

export const setRefreshToken = async (userId, token) => {
  await redis.set(refreshTokenKey(userId), token, {
    EX: Number(ENV.REDIS_REFRESH_TOKEN_EXPIRES),
  });
};

export const getRefreshToken = async (userId) => {
  return redis.get(refreshTokenKey(userId));
};

export const deleteRefreshToken = async (userId) => {
  await redis.del(refreshTokenKey(userId));
};

// USER PROFILE CACHE

const userCacheKey = (userId) => `user:${userId}`;

export const getCachedUser = async (userId) => {
  const cached = await redis.get(userCacheKey(userId));
  return cached ? JSON.parse(cached) : null;
};

export const setCachedUser = async (userId, userData) => {
  await redis.set(userCacheKey(userId), JSON.stringify(userData), {
    EX: Number(ENV.REDIS_USER_CACHE_TTL),
  });
};

export const deleteCachedUser = async (userId) => {
  await redis.del(userCacheKey(userId));
};