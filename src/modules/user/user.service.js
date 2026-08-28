import { prisma } from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import {
  deleteRefreshToken,
  getCachedUser,
  setCachedUser,
  deleteCachedUser,
  setRefreshToken,
} from "../../services/redis.service.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { logActivity } from "../activity/activity.service.js";

export const upgradeGuestToHost = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", STATUS_CODES.NOT_FOUND);
  }

  if (user.role !== "GUEST") {
    throw new AppError(
      user.role === "HOST"
        ? "You are already a HOST"
        : "This account type cannot be upgraded to HOST",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: "HOST" },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await logActivity({
    type: "ROLE_CHANGED",
    description: "Upgraded own account from GUEST to HOST",
    actorId: userId,
    targetId: userId,
    metadata: { oldRole: "GUEST", newRole: "HOST" },
  });

  await deleteCachedUser(userId);

  const tokenPayload = {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  await setRefreshToken(userId, refreshToken);

  return {
    user: updatedUser,
    accessToken,
    refreshToken,
  };
};

export const adminUpdateUser = async (targetUserId, updates, actingAdmin) => {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!target) {
    throw new AppError("User not found", STATUS_CODES.NOT_FOUND);
  }

  if (["ADMIN", "SUPER_ADMIN"].includes(target.role)) {
    throw new AppError(
      "Use admin management endpoints to modify admin accounts",
      STATUS_CODES.FORBIDDEN,
    );
  }

  const { role, status } = updates;
  const updateData = {};

  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: updateData,
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  const roleChanged = role !== undefined && role !== target.role;
  const statusChanged = status !== undefined && status !== target.status;

  if (roleChanged) {
    await logActivity({
      type: "ROLE_CHANGED",
      description: `Admin changed ${target.email ?? target.phone}'s role from ${target.role} to ${role}`,
      actorId: actingAdmin.id,
      actorEmail: actingAdmin.email,
      targetId: targetUserId,
      metadata: { oldRole: target.role, newRole: role },
    });
  }

  if (statusChanged) {
    const type =
      status === "SUSPENDED"
        ? "ACCOUNT_SUSPENDED"
        : status === "DISABLED"
          ? "ACCOUNT_DISABLED"
          : "STATUS_CHANGED";

    await logActivity({
      type,
      description: `Admin changed ${target.email ?? target.phone}'s status from ${target.status} to ${status}`,
      actorId: actingAdmin.id,
      actorEmail: actingAdmin.email,
      targetId: targetUserId,
      metadata: { oldStatus: target.status, newStatus: status },
    });
  }

  await deleteCachedUser(targetUserId);

  return updated;
};

export const getCurrentUser = async (userId) => {
  const cached = await getCachedUser(userId);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      provider: true,
      role: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          dob: true,
          avatarUrl: true,
          thumbnailUrl: true,
          bannerUrl: true,
          bannerThumbnailUrl: true,
          bio: true,
        },
      },
    },
  });

  if (user) await setCachedUser(userId, user);
  return user;
};

export const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      provider: true,
      role: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          dob: true,
          avatarUrl: true,
          thumbnailUrl: true,
          bannerUrl: true,
          bannerThumbnailUrl: true,
          bio: true,
        },
      },
    },
  });
};

export const deleteUserById = async (id) => {
  await prisma.user.delete({ where: { id: id } });

  await deleteRefreshToken(id);
  await deleteCachedUser(id);

  return true;
};

export const getAllUsers = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          {
            profile: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }
    : {};

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        provider: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const updateCurrentUser = async (userId, data) => {
  const { firstName, lastName, username, dob, bio, status } = data;

  if (username) {
    const existingProfile = await prisma.profile.findFirst({
      where: { username, NOT: { userId } },
    });
    if (existingProfile) {
      throw new AppError("Username already exists", STATUS_CODES.CONFLICT);
    }
  }

  const userUpdates = {};

  if (status !== undefined) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (currentUser.status === "SUSPENDED") {
      throw new AppError(
        "Your account is suspended. Contact support to reactivate it.",
        STATUS_CODES.FORBIDDEN,
      );
    }

    if (status !== currentUser.status) {
      userUpdates.status = status;

      await logActivity({
        type: status === "DISABLED" ? "ACCOUNT_DISABLED" : "ACCOUNT_ACTIVATED",
        description: `User self-${status.toLowerCase()}d their account`,
        actorId: userId,
        targetId: userId,
      });
    }
  }

  const profileUpdates = {};
  if (firstName !== undefined) profileUpdates.firstName = firstName;
  if (lastName !== undefined) profileUpdates.lastName = lastName;
  if (username !== undefined) profileUpdates.username = username;
  if (dob !== undefined) profileUpdates.dob = new Date(dob);
  if (bio !== undefined) profileUpdates.bio = bio;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdates,
      profile: {
        upsert: { create: profileUpdates, update: profileUpdates },
      },
    },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      provider: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  await deleteCachedUser(userId);
  return updatedUser;
};

export const updateProfileMedia = async (userId, mediaUpdates) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profile: {
        upsert: {
          create: mediaUpdates,
          update: mediaUpdates,
        },
      },
    },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      provider: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  await deleteCachedUser(userId);
  return updatedUser;
};

export const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    throw new AppError(
      "Current and new password are required",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw new AppError(
      "This account has no password set. Use social/OTP login instead.",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError(
      "Current password is incorrect",
      STATUS_CODES.UNAUTHORIZED,
    );
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password",
      STATUS_CODES.BAD_REQUEST,
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await deleteRefreshToken(userId);

  await deleteCachedUser(userId);
};

export const deleteCurrentUser = async (userId) => {
  await prisma.user.delete({ where: { id: userId } });

  await deleteRefreshToken(userId);
  await deleteCachedUser(userId);

  return true;
};
