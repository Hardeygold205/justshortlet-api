import { prisma } from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { logActivity } from "../activity/activity.service.js";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const adminSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  profile: { select: { firstName: true, lastName: true, username: true } },
};

export const createAdmin = async (payload, createdByUserId) => {
  const { email, password, firstName, lastName, role } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new AppError("Email already exists", STATUS_CODES.CONFLICT);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      provider: "local",
      role,
      emailVerified: true,
      profile: {
        create: { firstName, lastName },
      },
    },
    select: adminSelect,
  });

  await logActivity({
    type: "ADMIN_CREATED",
    description: `Admin account created: ${admin.email}`,
    actorId: createdByUserId,
    targetId: admin.id,
  });

  return admin;
};

export const listAdmins = async () => {
  return prisma.user.findMany({
    where: { role: { in: ADMIN_ROLES } },
    select: adminSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const getAdminById = async (id) => {
  const admin = await prisma.user.findFirst({
    where: { id, role: { in: ADMIN_ROLES } },
    select: adminSelect,
  });

  if (!admin) {
    throw new AppError("Admin not found", STATUS_CODES.NOT_FOUND);
  }

  return admin;
};

export const updateAdmin = async (targetId, updates, actingUserId) => {
  const target = await prisma.user.findFirst({
    where: { id: targetId, role: { in: ADMIN_ROLES } },
  });

  if (!target) {
    throw new AppError("Admin not found", STATUS_CODES.NOT_FOUND);
  }

  const { role, status } = updates;

  if (targetId === actingUserId && role && role !== target.role) {
    throw new AppError(
      "You cannot change your own role",
      STATUS_CODES.FORBIDDEN,
    );
  }

  if (
    role &&
    role !== target.role &&
    role === "ADMIN" &&
    target.role === "SUPER_ADMIN"
  ) {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      throw new AppError(
        "Cannot demote the last remaining SUPER_ADMIN",
        STATUS_CODES.FORBIDDEN,
      );
    }
  }

  const userUpdates = {};
  if (role !== undefined) userUpdates.role = role;
  if (status !== undefined) userUpdates.status = status;

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: userUpdates,
    select: adminSelect,
  });

  await logActivity({
    type: "ADMIN_UPDATED",
    description: `Admin account updated: ${target.email}`,
    actorId: actingUserId,
    targetId: targetId,
    metadata: {
      oldRole: target.role,
      newRole: role,
      oldStatus: target.status,
      newStatus: status,
    },
  });

  return updated;
};

export const deleteAdmin = async (targetId, actingUserId) => {
  const target = await prisma.user.findFirst({
    where: { id: targetId, role: { in: ADMIN_ROLES } },
  });

  if (!target) {
    throw new AppError("Admin not found", STATUS_CODES.NOT_FOUND);
  }

  if (targetId === actingUserId) {
    throw new AppError(
      "You cannot delete your own account",
      STATUS_CODES.FORBIDDEN,
    );
  }

  if (target.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      throw new AppError(
        "Cannot delete the last remaining SUPER_ADMIN",
        STATUS_CODES.FORBIDDEN,
      );
    }
  }

  await prisma.user.delete({ where: { id: targetId } });

  await logActivity({
    type: "ADMIN_DELETED",
    description: `Admin account deleted: ${target.email}`,
    actorId: actingUserId,
    targetId: targetId, 
  });
};
