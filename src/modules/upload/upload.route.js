import { Router } from "express";
import validate from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  uploadImage,
  uploadImageMemory,
  uploadVideo,
  uploadVideoMemory,
  uploadAudio,
  uploadAudioMemory,
  uploadDoc,
  uploadDocMemory,
  uploadAny,
  uploadAnyMemory,
} from "../../config/multer.js";
import {
  uploadFileSchema,
  uploadAnyFileSchema,
  deleteFileSchema,
} from "../../schema/upload.schema.js";
import {
  uploadSingle,
  uploadMultiple,
  uploadAny as uploadAnyController,
  removeFile,
} from "./upload.controller.js";
import ENV from "../../config/env.js";

const router = Router();

const MULTER_MAP = {
  image: { local: uploadImage, cloudinary: uploadImageMemory },
  video: { local: uploadVideo, cloudinary: uploadVideoMemory },
  audio: { local: uploadAudio, cloudinary: uploadAudioMemory },
  doc: { local: uploadDoc, cloudinary: uploadDocMemory },
};

const getMulterInstance = (category) => {
  const driver = ENV.STORAGE_DRIVER === "cloudinary" ? "cloudinary" : "local";
  return MULTER_MAP[category]?.[driver];
};

const handleMulterErrors = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

router.post(
  "/single/:category",
  authenticate,
  (req, res, next) => {
    const instance = getMulterInstance(req.params.category);
    if (!instance) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Unsupported category: ${req.params.category}`,
        });
    }
    handleMulterErrors(instance.single("file"))(req, res, next);
  },
  validate(uploadFileSchema),
  uploadSingle,
);

router.post(
  "/multiple/:category",
  authenticate,
  (req, res, next) => {
    const instance = getMulterInstance(req.params.category);
    if (!instance) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Unsupported category: ${req.params.category}`,
        });
    }
    handleMulterErrors(instance.array("files", 10))(req, res, next);
  },
  validate(uploadFileSchema),
  uploadMultiple,
);

router.post(
  "/any",
  authenticate,
  (req, res, next) => {
    const instance =
      ENV.STORAGE_DRIVER === "cloudinary" ? uploadAnyMemory : uploadAny;
    handleMulterErrors(instance.array("files", 10))(req, res, next);
  },
  validate(uploadAnyFileSchema),
  uploadAnyController,
);

router.delete("/", authenticate, validate(deleteFileSchema), removeFile);

export default router;
