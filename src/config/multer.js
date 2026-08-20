import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import ENV from "./env.js";

export const UPLOAD_ROOT = path.resolve(ENV.STORAGE_PATH);

const LIMITS = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  doc: 5 * 1024 * 1024,
};

const ALLOWED_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ],
  video: [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
    "video/3gpp",
  ],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm",
    "audio/flac",
  ],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
};

const FOLDER_MAP = {
  image: "images",
  video: "videos",
  audio: "audio",
  doc: "docs",
};

const detectType = (mimetype) => {
  if (ALLOWED_TYPES.image.includes(mimetype)) return "image";
  if (ALLOWED_TYPES.video.includes(mimetype)) return "video";
  if (ALLOWED_TYPES.audio.includes(mimetype)) return "audio";
  if (ALLOWED_TYPES.doc.includes(mimetype)) return "doc";
  return null;
};

const ensureDirs = () => {
  for (const folder of Object.values(FOLDER_MAP)) {
    const dir = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDirs();

const uniqueFilename = (file) => {
  const ext = path.extname(file.originalname);
  const hash = crypto.randomBytes(16).toString("hex");
  return `${Date.now()}-${hash}${ext}`;
};

// -----------------------------
// DISK STORAGE FOR LOCAL
// -----------------------------

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = detectType(file.mimetype);
    const folder = FOLDER_MAP[type] || "others";
    const dir = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, uniqueFilename(file));
  },
});

const createDiskUpload = (allowedTypes, maxSize) => {
  return multer({
    storage: diskStorage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
      cb(null, true);
    },
  });
};

export const uploadImage = createDiskUpload(ALLOWED_TYPES.image, LIMITS.image);
export const uploadVideo = createDiskUpload(ALLOWED_TYPES.video, LIMITS.video);
export const uploadAudio = createDiskUpload(ALLOWED_TYPES.audio, LIMITS.audio);
export const uploadDoc = createDiskUpload(ALLOWED_TYPES.doc, LIMITS.doc);

export const uploadAny = multer({
  storage: diskStorage,
  limits: { fileSize: LIMITS.video },
  fileFilter: (req, file, cb) => {
    const type = detectType(file.mimetype);
    if (!type) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    req.fileType = type;
    cb(null, true);
  },
});

// -----------------------------
// MEMORY STORAGE FOR CLOUDINARY
// -----------------------------

const memoryStorage = multer.memoryStorage();

const createMemoryUpload = (allowedTypes, maxSize) => {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
      cb(null, true);
    },
  });
};

export const uploadImageMemory = createMemoryUpload(
  ALLOWED_TYPES.image,
  LIMITS.image,
);
export const uploadVideoMemory = createMemoryUpload(
  ALLOWED_TYPES.video,
  LIMITS.video,
);
export const uploadAudioMemory = createMemoryUpload(
  ALLOWED_TYPES.audio,
  LIMITS.audio,
);
export const uploadDocMemory = createMemoryUpload(
  ALLOWED_TYPES.doc,
  LIMITS.doc,
);

export const uploadAnyMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: LIMITS.video },
  fileFilter: (req, file, cb) => {
    const type = detectType(file.mimetype);
    if (!type) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    req.fileType = type;
    cb(null, true);
  },
});

export { LIMITS, ALLOWED_TYPES, FOLDER_MAP, detectType };
