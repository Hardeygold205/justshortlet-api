import * as propertyService from "./property.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

// ── Host ──────────────────────────────
export const createPropertyHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.createProperty(req.user.id, req.body);
  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Property created successfully",
    property,
  );
});

export const getMyPropertiesHandler = asyncHandler(async (req, res) => {
  const result = await propertyService.getMyProperties(
    req.user.id,
    req.validatedQuery,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Properties fetched successfully",
    result,
  );
});

export const getMyPropertyHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.getMyPropertyById(
    req.params.id,
    req.user.id,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Property fetched successfully",
    property,
  );
});

export const updatePropertyHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.updateProperty(
    req.params.id,
    req.user.id,
    req.body,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Property updated successfully",
    property,
  );
});

export const deletePropertyHandler = asyncHandler(async (req, res) => {
  await propertyService.deleteProperty(req.params.id, req.user.id);
  return successResponse(res, STATUS_CODES.OK, "Property deleted successfully");
});

export const submitPropertyHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.submitPropertyForReview(
    req.params.id,
    req.user.id,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Property submitted for review",
    property,
  );
});

export const blockDatesHandler = asyncHandler(async (req, res) => {
  const block = await propertyService.blockPropertyDates(
    req.params.id,
    req.user.id,
    req.body,
  );
  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Dates blocked successfully",
    block,
  );
});

export const attachImagesHandler = asyncHandler(async (req, res) => {
  const images = await propertyService.attachPropertyImages(
    req.params.id,
    req.user.id,
    req.body.uploadIds,
  );
  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Images attached successfully",
    images,
  );
});

export const setCoverImageHandler = asyncHandler(async (req, res) => {
  const images = await propertyService.setCoverImage(
    req.params.id,
    req.params.imageId,
    req.user.id,
  );
  return successResponse(res, STATUS_CODES.OK, "Cover image updated", images);
});

export const deletePropertyImageHandler = asyncHandler(async (req, res) => {
  await propertyService.deletePropertyImage(
    req.params.id,
    req.params.imageId,
    req.user.id,
  );
  return successResponse(res, STATUS_CODES.OK, "Image removed successfully");
});

// ── Public ──────────────────────────────
export const listPublicPropertiesHandler = asyncHandler(async (req, res) => {
  const result = await propertyService.listPublicProperties(req.validatedQuery);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Properties fetched successfully",
    result,
  );
});

export const getPublicPropertyHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.getPublicPropertyById(req.params.id);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Property fetched successfully",
    property,
  );
});

export const getCalendarHandler = asyncHandler(async (req, res) => {
  const calendar = await propertyService.getPropertyCalendarPublic(
    req.params.id,
    req.validatedQuery.from,
    req.validatedQuery.to,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Calendar fetched successfully",
    calendar,
  );
});

// ── Admin ──────────────────────────────
export const adminListPropertiesHandler = asyncHandler(async (req, res) => {
  const result = await propertyService.adminListProperties(req.validatedQuery);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Properties fetched successfully",
    result,
  );
});

export const adminGetPropertyHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.adminGetPropertyById(req.params.id);
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Property fetched successfully",
    property,
  );
});

export const adminUpdateStatusHandler = asyncHandler(async (req, res) => {
  const property = await propertyService.adminUpdatePropertyStatus(
    req.params.id,
    req.body,
    req.user,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Property status updated successfully",
    property,
  );
});
