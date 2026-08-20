import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import {
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  addTokenToBlacklist,
} from "../../services/redis.service.js";

export const exchangeSupabaseToken = async (supabaseAccessToken) => {
  const {
    data: { user: supabaseUser },
    error,
  } = await supabaseAdmin.auth.getUser(supabaseAccessToken);

  if (error || !supabaseUser) {
    const err = new Error("Invalid Supabase token");
    err.statusCode = 401;
    throw err;
  }

  const email = supabaseUser.email ? supabaseUser.email.toLowerCase() : null;
  const phone = supabaseUser.phone || null;
  const supabaseId = supabaseUser.id;
  const provider = supabaseUser.app_metadata?.provider || "supabase";
  const providerId = supabaseUser.user_metadata?.sub || supabaseId;

  let user = await prisma.user.findUnique({
    where: { supabaseId },
    include: { profile: true },
  });

  let isNewUser = false;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        phone,
        supabaseId,
        provider,
        providerId,
        profile: {
          create: {
            firstName:
              supabaseUser.user_metadata?.full_name?.split(" ")[0] || null,
            lastName:
              supabaseUser.user_metadata?.full_name?.split(" ")[1] || null,
            avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
          },
        },
      },
      include: { profile: true },
    });
    isNewUser = true;
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await setRefreshToken(user.id, refreshToken);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    isNewUser,
    hasProfile: Boolean(user.profile?.username),
    accessToken,
    refreshToken,
  };
};

export const registerUser = async (payload) => {
  const { email, password, firstName, lastName, username } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { profile: { username } }],
    },
    include: { profile: true },
  });

  if (existingUser) {
    const error = new Error(
      existingUser.email === normalizedEmail
        ? "Email already exists"
        : "Username already taken",
    );
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      provider: "local",
      profile: {
        create: {
          username,
          firstName,
          lastName,
        },
      },
    },
  });

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await setRefreshToken(user.id, refreshToken);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    isNewUser: true,
    hasProfile: true,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });

  if (!user || !user.passwordHash) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await setRefreshToken(user.id, refreshToken);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    hasProfile: Boolean(user.profile?.username),
    accessToken,
    refreshToken,
  };
};

export const refreshUserToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);

  const storedToken = await getRefreshToken(decoded.id);

  if (!storedToken || storedToken !== refreshToken) {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  });

  return { accessToken };
};

export const logoutUser = async (userId, accessToken) => {
  await deleteRefreshToken(userId);

  const decoded = jwt.decode(accessToken);
  if (decoded?.exp) {
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await addTokenToBlacklist(accessToken, expiresIn);
    }
  }

  return true;
};
