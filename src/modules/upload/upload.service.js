import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import cloudinary from "../../config/cloudinary.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { UPLOAD_ROOT, detectType } from "../../config/multer.js";
import ENV from "../../config/env.js";

// ─────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────

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
    path: relativePath,
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

// ─────────────────────────────────────────────
// CLOUDINARY
// ─────────────────────────────────────────────

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
          publicId: result.public_id,
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

// ─────────────────────────────────────────────
// UNIFIED ENTRY POINTS — driver decided by ENV.STORAGE_DRIVER only
// ─────────────────────────────────────────────

export const uploadSingleFile = async (file, folder = "general") => {
  if (ENV.STORAGE_DRIVER === "cloudinary") {
    return uploadToCloudinary(file.buffer, folder, file.mimetype);
  }
  return registerLocalUpload(file);
};

export const uploadMultipleFiles = async (files, folder = "general") => {
  return Promise.all(files.map((file) => uploadSingleFile(file, folder)));
};

export const deleteUploadedFile = async (
  identifier,
  resourceType = "image",
) => {
  if (ENV.STORAGE_DRIVER === "cloudinary") {
    return deleteFromCloudinary(identifier, resourceType);
  }
  return deleteLocalFile(identifier);
};

export const uploadAvatar = async (fileBuffer, userId, mimeType) => {
  const filePath = `avatars/${userId}_${Date.now()}.jpg`;

  const { error } = await supabaseAdmin.storage
    .from("images")
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage.from("images").getPublicUrl(filePath);

  const { data: thumbData } = supabaseAdmin.storage
    .from("images")
    .getPublicUrl(filePath, {
      transform: {
        width: 150,
        height: 150,
        resize: "cover",
      },
    });

  return {
    avatarUrl: data.publicUrl,
    thumbnailUrl: thumbData.publicUrl,
  };
};

export const updateAvatar = async (
  fileBuffer,
  userId,
  mimeType,
  oldFilePath = null,
) => {
  const filePath = `avatars/${userId}_${Date.now()}.jpg`;

  const { error } = await supabaseAdmin.storage
    .from("images")
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage.from("images").getPublicUrl(filePath);

  const { data: thumbData } = supabaseAdmin.storage
    .from("images")
    .getPublicUrl(filePath, {
      transform: { width: 150, height: 150, resize: "cover" },
    });

  if (oldFilePath) {
    await supabaseAdmin.storage.from("images").remove([oldFilePath]);
  }

  return {
    avatarUrl: data.publicUrl,
    thumbnailUrl: thumbData.publicUrl,
    filePath,
  };
};

export const deleteAvatar = async (filePath) => {
  const { error } = await supabaseAdmin.storage
    .from("images")
    .remove([filePath]);

  if (error) throw new Error(error.message);
};
