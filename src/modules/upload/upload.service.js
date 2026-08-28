import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import cloudinary from "../../config/cloudinary.js";
import { UPLOAD_ROOT, detectType } from "../../config/multer.js";
import ENV from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../utils/AppError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { CATEGORY_MAP, RESOURCE_TYPE_MAP } from "../../constants/upload.js";

const saveUploadRecord = async (userId, folder, result) => {
  console.log("Attempting to save upload record:", {
    userId,
    driver: ENV.STORAGE_DRIVER === "cloudinary" ? "CLOUDINARY" : "LOCAL",
    category: CATEGORY_MAP[result.resourceType],
    identifier: result.identifier,
  });

  try {
    const record = await prisma.upload.create({
      data: {
        userId,
        driver: ENV.STORAGE_DRIVER === "cloudinary" ? "CLOUDINARY" : "LOCAL",
        category: CATEGORY_MAP[result.resourceType] || "DOC",
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        identifier: result.identifier,
        folder,
        format: result.format,
        size: result.size,
        duration: result.duration,
      },
    });
    console.log("Upload record saved:", record.id);
    return record;
  } catch (err) {
    console.error("Failed to save upload record:", err);
    throw err;
  }
};

// LOCAL STORAGE

export const buildFileUrl = (relativePath) => {
  const normalized = relativePath.split(path.sep).join("/");
  return `${ENV.STORAGE_URL}/${normalized}`;
};

export const generateLocalThumbnail = async (fullPath, mimetype) => {
  const fileType = detectType(mimetype);
  if (fileType !== "image") return null;

  const dir = path.dirname(fullPath);
  const ext = path.extname(fullPath);
  const base = path.basename(fullPath, ext);
  const thumbFullPath = path.join(dir, `${base}_thumb${ext}`);

  await sharp(fullPath)
    .resize(300, 300, { fit: "cover" })
    .toFile(thumbFullPath);

  const relativeThumb = path.relative(UPLOAD_ROOT, thumbFullPath);
  return buildFileUrl(relativeThumb);
};

export const registerLocalUpload = async (file) => {
  const fileType = detectType(file.mimetype);
  const relativePath = path.relative(UPLOAD_ROOT, file.path);
  const thumbnailUrl = await generateLocalThumbnail(file.path, file.mimetype);

  return {
    url: buildFileUrl(relativePath),
    thumbnailUrl,
    identifier: relativePath, // renamed from `path` to match Upload.identifier
    resourceType: fileType,
    format: path.extname(file.originalname).replace(".", ""),
    size: file.size,
    duration: null,
  };
};

export const deleteLocalFile = async (relativePath) => {
  const fullPath = path.join(UPLOAD_ROOT, relativePath);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
};

// CLOUDINARY

export const generateCloudinaryThumbnailUrl = (
  publicId,
  resourceType = "image",
) => {
  if (!publicId || resourceType === "raw") return null;

  if (resourceType === "image") {
    return cloudinary.url(publicId, {
      width: 300,
      height: 300,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  if (resourceType === "video") {
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      width: 400,
      height: 300,
      crop: "fill",
      start_offset: "0",
    });
  }

  return null;
};

export const uploadToCloudinary = async (fileBuffer, folder, mimetype) => {
  const fileType = detectType(mimetype);
  const resourceType =
    fileType === "doc" ? "raw" : fileType === "image" ? "image" : "video";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        transformation:
          fileType === "image"
            ? [
                { width: 1080, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
              ]
            : undefined,
      },
      (error, result) => {
        if (error || !result) return reject(error);

        const thumbnailUrl = generateCloudinaryThumbnailUrl(
          result.public_id,
          resourceType,
        );

        resolve({
          url: result.secure_url,
          thumbnailUrl,
          identifier: result.public_id, // renamed from publicId to match Upload.identifier
          resourceType: result.resource_type,
          format: result.format,
          size: result.bytes,
          duration: result.duration || null,
        });
      },
    );
    stream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// UPLOAD ENTRY POINTS

export const uploadSingleFile = async (file, folder = "general", userId) => {
  const result =
    ENV.STORAGE_DRIVER === "cloudinary"
      ? await uploadToCloudinary(file.buffer, folder, file.mimetype)
      : await registerLocalUpload(file);

  const record = await saveUploadRecord(userId, folder, result);

  return { ...result, id: record.id };
};

export const uploadMultipleFiles = async (
  files,
  folder = "general",
  userId,
) => {
  return Promise.all(
    files.map((file) => uploadSingleFile(file, folder, userId)),
  );
};

export const deleteUploadedFile = async (identifier, userId) => {
  const record = await prisma.upload.findFirst({ where: { identifier } });

  if (!record) {
    throw new AppError("File not found", STATUS_CODES.NOT_FOUND);
  }

  if (record.userId !== userId) {
    throw new AppError(
      "You do not have permission to delete this file",
      STATUS_CODES.FORBIDDEN,
    );
  }

  if (record.driver === "CLOUDINARY") {
    const resourceType = RESOURCE_TYPE_MAP[record.category] || "image";
    await deleteFromCloudinary(identifier, resourceType);
  } else {
    await deleteLocalFile(identifier);
  }

  await prisma.upload.delete({ where: { id: record.id } });
};
