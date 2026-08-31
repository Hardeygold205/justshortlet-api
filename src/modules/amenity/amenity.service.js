import { prisma } from "../../config/prisma.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { logActivity } from "../activity/activity.service.js";

export const listAmenities = async () => {
  return prisma.amenity.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
};

export const createAmenity = async (data, adminUser) => {
  const existing = await prisma.amenity.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new AppError(
      "An amenity with this slug already exists",
      STATUS_CODES.CONFLICT,
    );
  }

  const amenity = await prisma.amenity.create({ data });

  await logActivity({
    type: "SYSTEM_EVENT",
    description: `Amenity "${amenity.name}" created`,
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    targetId: amenity.id,
  });

  return amenity;
};

export const updateAmenity = async (id, data, adminUser) => {
  const amenity = await prisma.amenity.findUnique({ where: { id } });
  if (!amenity) throw new AppError("Amenity not found", STATUS_CODES.NOT_FOUND);

  if (data.slug && data.slug !== amenity.slug) {
    const slugTaken = await prisma.amenity.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken)
      throw new AppError(
        "An amenity with this slug already exists",
        STATUS_CODES.CONFLICT,
      );
  }

  const updated = await prisma.amenity.update({ where: { id }, data });

  await logActivity({
    type: "SYSTEM_EVENT",
    description: `Amenity "${amenity.name}" updated`,
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    targetId: id,
  });

  return updated;
};

export const deleteAmenity = async (id, adminUser) => {
  const amenity = await prisma.amenity.findUnique({ where: { id } });
  if (!amenity) throw new AppError("Amenity not found", STATUS_CODES.NOT_FOUND);

  const inUseCount = await prisma.propertyAmenity.count({
    where: { amenityId: id },
  });
  if (inUseCount > 0) {
    throw new AppError(
      `Cannot delete — this amenity is attached to ${inUseCount} propert${inUseCount === 1 ? "y" : "ies"}`,
      STATUS_CODES.CONFLICT,
    );
  }

  await prisma.amenity.delete({ where: { id } });

  await logActivity({
    type: "SYSTEM_EVENT",
    description: `Amenity "${amenity.name}" deleted`,
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    targetId: id,
  });
};
