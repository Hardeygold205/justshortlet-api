// @ts-nocheck
import { prisma } from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const TYPE_CATEGORY_MAP = {
  ACCOUNT_CREATED: "ACCOUNT",
  ACCOUNT_UPDATED: "ACCOUNT",
  ACCOUNT_SUSPENDED: "ACCOUNT",
  ACCOUNT_DISABLED: "ACCOUNT",
  ACCOUNT_ACTIVATED: "ACCOUNT",
  ACCOUNT_DELETED: "ACCOUNT",
  EMAIL_ADDED: "ACCOUNT",
  PHONE_ADDED: "ACCOUNT",
  ROLE_CHANGED: "ACCOUNT",
  STATUS_CHANGED: "ACCOUNT",

  PROPERTY_CREATED: "PROPERTY",
  PROPERTY_UPDATED: "PROPERTY",
  PROPERTY_SUBMITTED: "PROPERTY",
  PROPERTY_STATUS_CHANGED: "PROPERTY",
  PROPERTY_DELETED: "PROPERTY",

  BOOKING_CREATED: "BOOKING",
  BOOKING_UPDATED: "BOOKING",
  BOOKING_CANCELLED: "BOOKING",

  PAYMENT_INITIATED: "TRANSACTION",
  PAYMENT_COMPLETED: "TRANSACTION",
  PAYMENT_FAILED: "TRANSACTION",

  SYSTEM_EVENT: "SYSTEM",

  LOGIN_SUCCESS: "AUTH",
  LOGIN_FAILED: "AUTH",
  PASSWORD_RESET_REQUESTED: "AUTH",
  PASSWORD_RESET_SUCCESS: "AUTH",
  ADMIN_CREATED: "AUTH",
  ADMIN_UPDATED: "AUTH",
  ADMIN_DELETED: "AUTH",
};

export const logActivity = async ({
  type,
  description,
  actorId = undefined,
  actorEmail = undefined,
  targetId = undefined,
  metadata = undefined,
}) => {
  try {
    return await prisma.activity.create({
      data: {
        type,
        category: TYPE_CATEGORY_MAP[type] ?? "SYSTEM",
        description,
        actorId,
        actorEmail,
        targetId,
        metadata: metadata ?? Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

const TIMEFRAME_MS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const buildDateFilter = (timeframe, from, to) => {
  if (from || to) {
    const range = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    return range;
  }
  if (timeframe && TIMEFRAME_MS[timeframe]) {
    return { gte: new Date(Date.now() - TIMEFRAME_MS[timeframe]) };
  }
  return undefined;
};

const buildPagination = (total, page, limit, resultCount) => ({
  total,
  totalPages: Math.ceil(total / limit),
  currentPage: page,
  limit,
  hasNextPage: (page - 1) * limit + resultCount < total,
  hasPrevPage: page > 1,
});

export const getAllActivities = async ({
  page = 1,
  limit = 20,
  category = undefined,
  type = undefined,
  actorId = undefined,
  targetId = undefined,
  timeframe = undefined,
  from = undefined,
  to = undefined,
} = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);

  const where = {};
  if (category) where.category = category;
  if (type) where.type = type;
  if (actorId) where.actorId = actorId;
  if (targetId) where.targetId = targetId;

  const dateFilter = buildDateFilter(timeframe, from, to);
  if (dateFilter) where.createdAt = dateFilter;

  const skip = (parsedPage - 1) * parsedLimit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parsedLimit,
      skip,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    pagination: buildPagination(
      total,
      parsedPage,
      parsedLimit,
      activities.length,
    ),
  };
};

export const getActivitiesByUserId = async (
  userId,
  {
    page = 1,
    limit = 20,
    category = undefined,
    type = undefined,
    timeframe = undefined,
    from = undefined,
    to = undefined,
  } = {},
) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);

  const where = { OR: [{ targetId: userId }, { actorId: userId }] };
  if (category) where.category = category;
  if (type) where.type = type;

  const dateFilter = buildDateFilter(timeframe, from, to);
  if (dateFilter) where.createdAt = dateFilter;

  const skip = (parsedPage - 1) * parsedLimit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parsedLimit,
      skip,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    pagination: buildPagination(
      total,
      parsedPage,
      parsedLimit,
      activities.length,
    ),
  };
};

const RETENTION_DAYS_BY_CATEGORY = {
  AUTH: 180,
  ACCOUNT: 90,
  BOOKING: 90,
  TRANSACTION: 365,
  SYSTEM: 30,
};

export const cleanupOldActivities = async () => {
  let totalDeleted = 0;

  for (const [category, days] of Object.entries(RETENTION_DAYS_BY_CATEGORY)) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const deleted = await prisma.activity.deleteMany({
      where: { category, createdAt: { lt: cutoff } },
    });
    totalDeleted += deleted.count;
  }

  console.log(
    `[Activity Cleanup] Deleted ${totalDeleted} records across all categories.`,
  );
  return totalDeleted;
};

setInterval(
  () => {
    cleanupOldActivities().catch((err) =>
      console.error("Activity cleanup error:", err.message),
    );
  },
  24 * 60 * 60 * 1000,
);
