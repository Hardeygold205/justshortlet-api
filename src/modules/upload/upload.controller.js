import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile,
} from "./upload.service.js";
import AppError from "../../utils/AppError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", STATUS_CODES.BAD_REQUEST);
  }

  const folder = req.body.folder || "general";
  const result = await uploadSingleFile(req.file, folder, req.user.id);

  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "File uploaded successfully",
    result,
  );
});

export const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError("No files uploaded", STATUS_CODES.BAD_REQUEST);
  }

  const folder = req.body.folder || "general";
  const results = await uploadMultipleFiles(req.files, folder, req.user.id);

  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Files uploaded successfully",
    results,
  );
});

export const uploadAny = asyncHandler(async (req, res) => {
  const folder = req.body.folder || "general";

  if (req.file) {
    const result = await uploadSingleFile(req.file, folder, req.user.id);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      "File uploaded successfully",
      result,
    );
  }

  if (req.files && req.files.length > 0) {
    const results = await uploadMultipleFiles(req.files, folder, req.user.id);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      "Files uploaded successfully",
      results,
    );
  }

  throw new AppError("No file(s) uploaded", STATUS_CODES.BAD_REQUEST);
});

export const removeFile = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  await deleteUploadedFile(identifier, req.user.id);

  return successResponse(res, STATUS_CODES.OK, "File deleted successfully");
});
