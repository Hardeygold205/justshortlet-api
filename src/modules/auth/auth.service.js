// @ts-nocheck
import { prisma } from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getTokenRemainingSeconds,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import {
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  addTokenToBlacklist,
  deleteCachedUser,
} from "../../services/redis.service.js";
import { sendSmsOtp } from "../../services/termii.service.js";
import { sendEmailOtp } from "../../services/mail.service.js";
import {
  verifyGoogleToken,
  verifyAppleToken,
} from "../../services/socialAuth.service.js";
import { generateOtp, OTP_EXPIRY_MINUTES } from "../../utils/otp.js";
import { logActivity } from "../activity/activity.service.js";

const buildTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

const issueTokens = async (user) => {
  const tokenPayload = buildTokenPayload(user);
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await setRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
};

export const socialLogin = async (provider, token) => {
  const profileData =
    provider === "google"
      ? await verifyGoogleToken(token)
      : provider === "apple"
        ? await verifyAppleToken(token)
        : (() => {
            throw new AppError(
              "Unsupported provider",
              STATUS_CODES.BAD_REQUEST,
            );
          })();

  let user = await prisma.user.findFirst({
    where: { provider, providerId: profileData.providerId },
    include: { profile: true },
  });

  let isNewUser = false;

  if (!user) {
    const existingEmailUser = profileData.email
      ? await prisma.user.findUnique({ where: { email: profileData.email } })
      : null;

    if (existingEmailUser) {
      throw new AppError(
        `This email is already registered via ${existingEmailUser.provider}. Please log in that way.`,
        STATUS_CODES.CONFLICT,
      );
    }

    user = await prisma.user.create({
      data: {
        email: profileData.email,
        emailVerified: true,
        provider,
        providerId: profileData.providerId,
        profile: {
          create: {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            avatarUrl: profileData.avatarUrl,
          },
        },
      },
      include: { profile: true },
    });
    isNewUser = true;

    await logActivity({
      type: "ACCOUNT_CREATED",
      description: `New ${user.role} account created via ${user.provider}`,
      targetId: user.id,
      actorEmail: user.email,
    });
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    isNewUser,
    hasProfile: Boolean(user.profile?.username),
    accessToken,
    refreshToken,
  };
};

export const registerUser = async (payload) => {
  const { email, password, firstName, lastName, username, role } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { profile: { username } }],
    },
    include: { profile: true },
  });

  if (existingUser) {
    throw new AppError(
      existingUser.email === normalizedEmail
        ? "Email already exists"
        : "Username already taken",
      STATUS_CODES.CONFLICT,
    );
  }

  const hashedPassword = await hashPassword(password);
  const allowedPublicRoles = ["GUEST", "HOST"];
  const finalRole = allowedPublicRoles.includes(role) ? role : "GUEST";

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      provider: "local",
      role: finalRole,
      profile: {
        create: { username, firstName, lastName },
      },
    },
  });

  await logActivity({
    type: "ACCOUNT_CREATED",
    description: `New ${user.role} account created via ${user.provider}`,
    targetId: user.id,
    actorEmail: user.email,
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider,
    },
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
    throw new AppError("Invalid credentials", STATUS_CODES.UNAUTHORIZED);
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError("Invalid credentials", STATUS_CODES.UNAUTHORIZED);
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(
      "Your account has been suspended. Contact support for assistance.",
      STATUS_CODES.FORBIDDEN,
    );
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    },
    hasProfile: Boolean(user.profile?.username),
    accessToken,
    refreshToken,
  };
};

export const refreshUserToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);

  const storedToken = await getRefreshToken(decoded.id);

  if (!storedToken || storedToken !== refreshToken) {
    throw new AppError(
      "Invalid or expired refresh token",
      STATUS_CODES.UNAUTHORIZED,
    );
  }

  const accessToken = generateAccessToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  });

  return { accessToken };
};

export const requestPhoneOtp = async (phone) => {
  const code = generateOtp();
  const hashedCode = await hashPassword(code);

  await prisma.otpVerification.create({
    data: {
      target: phone,
      code: hashedCode,
      purpose: "LOGIN",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  if (!process.env.TERMII_API_KEY) {
    console.log(`[DEV OTP] ${phone}: ${code}`);
    return;
  }

  await sendSmsOtp(phone, code);
};

export const verifyPhoneOtp = async (phone, code) => {
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      target: phone,
      purpose: "LOGIN",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || !(await comparePassword(code, otpRecord.code))) {
    throw new AppError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);
  }

  let user = await prisma.user.findUnique({
    where: { phone },
    include: { profile: true },
  });
  let isNewUser = false;

  if (!user) {
    user = await prisma.user.create({
      data: { phone, provider: "phone", phoneVerified: true },
      include: { profile: true },
    });
    isNewUser = true;

    await logActivity({
      type: "ACCOUNT_CREATED",
      description: `New ${user.role} account created via ${user.provider}`,
      targetId: user.id,
      metadata: { phone: user.phone },
    });
  }

  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      phoneVerified: user.phoneVerified,
    },
    isNewUser,
    hasProfile: Boolean(user.profile?.username),
    accessToken,
    refreshToken,
  };
};

export const requestEmailOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser && existingUser.provider !== "email_otp") {
    throw new AppError(
      `This email is registered via ${existingUser.provider}. Please log in that way.`,
      STATUS_CODES.CONFLICT,
    );
  }

  const code = generateOtp();
  const hashedCode = await hashPassword(code);

  await prisma.otpVerification.create({
    data: {
      target: normalizedEmail,
      code: hashedCode,
      purpose: "LOGIN",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  await sendEmailOtp(normalizedEmail, code);
};

export const verifyEmailOtp = async (email, code) => {
  const normalizedEmail = email.trim().toLowerCase();

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      target: normalizedEmail,
      purpose: "LOGIN",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || !(await comparePassword(code, otpRecord.code))) {
    throw new AppError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);
  }

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });
  let isNewUser = false;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        provider: "email_otp",
        emailVerified: true,
      },
      include: { profile: true },
    });
    isNewUser = true;

    await logActivity({
      type: "ACCOUNT_CREATED",
      description: `New ${user.role} account created via ${user.provider}`,
      targetId: user.id,
      actorEmail: user.email,
    });
  }

  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    isNewUser,
    hasProfile: Boolean(user.profile?.username),
    accessToken,
    refreshToken,
  };
};

export const requestVerifyEmailAdd = async (userId, email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing && existing.id !== userId) {
    throw new AppError("This email is already in use", STATUS_CODES.CONFLICT);
  }

  const code = generateOtp();
  const hashedCode = await hashPassword(code);

  await prisma.otpVerification.create({
    data: {
      target: normalizedEmail,
      code: hashedCode,
      purpose: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  await sendEmailOtp(normalizedEmail, code);
};

export const verifyEmailAdd = async (userId, email, code) => {
  const normalizedEmail = email.trim().toLowerCase();

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      target: normalizedEmail,
      purpose: "VERIFY_EMAIL",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || !(await comparePassword(code, otpRecord.code))) {
    throw new AppError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing && existing.id !== userId) {
    throw new AppError("This email is already in use", STATUS_CODES.CONFLICT);
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { email: normalizedEmail, emailVerified: true },
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        provider: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await tx.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    return user;
  });

  await logActivity({
    type: "EMAIL_ADDED",
    description: `Email ${normalizedEmail} added and verified`,
    actorId: userId,
    targetId: userId,
  });

  await deleteCachedUser(userId);

  return updatedUser;
};

export const requestVerifyPhoneAdd = async (userId, phone) => {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing && existing.id !== userId) {
    throw new AppError(
      "This phone number is already in use",
      STATUS_CODES.CONFLICT,
    );
  }

  const code = generateOtp();
  const hashedCode = await hashPassword(code);

  await prisma.otpVerification.create({
    data: {
      target: phone,
      code: hashedCode,
      purpose: "VERIFY_PHONE",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  await sendSmsOtp(phone, code);
};

export const verifyPhoneAdd = async (userId, phone, code) => {
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      target: phone,
      purpose: "VERIFY_PHONE",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || !(await comparePassword(code, otpRecord.code))) {
    throw new AppError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing && existing.id !== userId) {
    throw new AppError(
      "This phone number is already in use",
      STATUS_CODES.CONFLICT,
    );
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { phone, phoneVerified: true },
      select: {
        id: true,
        email: true,
        phoneVerified: true,
        phone: true,
        provider: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await tx.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    return user;
  });

  await logActivity({
    type: "PHONE_ADDED",
    description: `Phone ${phone} added and verified`,
    actorId: userId,
    targetId: userId,
  });

  await deleteCachedUser(userId);

  return updatedUser;
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.provider !== "local") return;

  const code = generateOtp();
  const hashedCode = await hashPassword(code);

  await prisma.otpVerification.create({
    data: {
      target: normalizedEmail,
      code: hashedCode,
      purpose: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  await sendEmailOtp(normalizedEmail, code);

  await logActivity({
    type: "PASSWORD_RESET_REQUESTED",
    description: `Password reset requested for ${normalizedEmail}`,
    targetId: user.id,
  });
};

export const resetPassword = async ({ email, code, newPassword }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user || user.provider !== "local") {
    throw new AppError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      target: normalizedEmail,
      purpose: "PASSWORD_RESET",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || !(await comparePassword(code, otpRecord.code))) {
    throw new AppError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    }),
  ]);

  await deleteRefreshToken(user.id);
  await deleteCachedUser(user.id);

  await logActivity({
    type: "PASSWORD_RESET_SUCCESS",
    description: `Password reset completed for ${normalizedEmail}`,
    targetId: user.id,
  });
};

export const logoutUser = async (userId, accessToken) => {
  await deleteRefreshToken(userId);

  const expiresIn = getTokenRemainingSeconds(accessToken);
  if (expiresIn > 0) {
    await addTokenToBlacklist(accessToken, expiresIn);
  }

  return true;
};
