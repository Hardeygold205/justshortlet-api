import cloudinary from "../config/cloudinary.js";
import { PROFILE_MEDIA_DIMENSIONS } from "../constants/upload.js";

export const uploadProfileMedia = async (
  type,
  fileBuffer,
  userId,
  mimeType,
  oldPath = null,
) => {
  const dimensions = PROFILE_MEDIA_DIMENSIONS[type];
  const folder = `${type}s`;

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${userId}_${Date.now()}`,
        resource_type: "image",
      },
      (err, res) => (err ? reject(err) : resolve(res)),
    );
    stream.end(fileBuffer);
  });

  const thumbnailUrl = cloudinary.url(result.public_id, {
    width: dimensions.width,
    height: dimensions.height,
    crop: "fill",
    gravity: "face",
    format: "jpg",
    secure: true,
  });

  if (oldPath) {
    await cloudinary.uploader.destroy(oldPath).catch((err) => {
      console.error(`Failed to delete old media (${oldPath}):`, err.message);
    });
  }

  return {
    url: result.secure_url,
    thumbnailUrl,
    path: result.public_id,
  };
};

export const deleteProfileMedia = async (path) => {
  const { result } = await cloudinary.uploader.destroy(path);
  if (result !== "ok" && result !== "not found") {
    throw new Error(`Failed to delete media: ${result}`);
  }
};
