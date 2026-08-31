export const UPLOAD_FOLDERS = [
  "general",
  "banner",
  "avatars",
  "documents",
  "property-images",
];

export const CATEGORIES = ["image", "video", "audio", "doc"];

export const CATEGORY_MAP = {
  image: "IMAGE",
  video: "VIDEO",
  audio: "AUDIO",
  doc: "DOC",
};

export const RESOURCE_TYPE_MAP = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "video",
  DOC: "raw",
};

export const PROFILE_MEDIA_TYPES = ["avatar", "banner"];

export const PROFILE_MEDIA_PERMISSIONS = {
  avatar: ["ADMIN", "GUEST", "HOST"],
  banner: ["HOST"],
};

export const PROFILE_MEDIA_DIMENSIONS = {
  avatar: { width: 150, height: 150 },
  banner: { width: 1200, height: 400 },
};
