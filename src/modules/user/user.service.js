import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import { hashPassword } from "../../utils/hash.js";

export const getCurrentUser = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      provider: true,
      role: true,
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
          bio: true,
        },
      },
    },
  });
};

export const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      provider: true,
      role: true,
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
          bio: true,
        },
      },
    },
  });
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
        provider: true,
        role: true,
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
  const {
    firstName,
    lastName,
    username,
    phone,
    dob,
    avatarUrl,
    thumbnailUrl,
    bio,
    password,
  } = data;

  if (username) {
    const existingProfile = await prisma.profile.findFirst({
      where: {
        username,
        NOT: { userId },
      },
    });

    if (existingProfile) {
      const error = new Error("Username already in use");
      error.statusCode = 409;
      throw error;
    }
  }

  const userUpdates = {};
  if (phone) userUpdates.phone = phone;

  if (password) {
    userUpdates.passwordHash = await hashPassword(password);
    await redis.del(`refresh:${userId}`);
  }

  const profileUpdates = {};
  if (firstName !== undefined) profileUpdates.firstName = firstName;
  if (lastName !== undefined) profileUpdates.lastName = lastName;
  if (username !== undefined) profileUpdates.username = username;
  if (dob !== undefined) profileUpdates.dob = new Date(dob);
  if (avatarUrl !== undefined) profileUpdates.avatarUrl = avatarUrl;
  if (thumbnailUrl !== undefined) profileUpdates.thumbnailUrl = thumbnailUrl;
  if (bio !== undefined) profileUpdates.bio = bio;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdates,
      profile: {
        upsert: {
          create: profileUpdates,
          update: profileUpdates,
        },
      },
    },
    select: {
      id: true,
      email: true,
      phone: true,
      provider: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  return updatedUser;
};

export const deleteCurrentUser = async (userId) => {
  await prisma.user.delete({
    where: { id: userId },
  });

  await redis.del(`refresh:${userId}`);
  return true;
};
