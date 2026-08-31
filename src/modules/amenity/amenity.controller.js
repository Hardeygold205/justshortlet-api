import * as amenityService from "./amenity.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { successResponse } from "../../utils/response.js";

export const listAmenitiesHandler = asyncHandler(async (req, res) => {
  const amenities = await amenityService.listAmenities();
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Amenities fetched successfully",
    amenities,
  );
});

export const createAmenityHandler = asyncHandler(async (req, res) => {
  const amenity = await amenityService.createAmenity(req.body, req.user);
  return successResponse(
    res,
    STATUS_CODES.CREATED,
    "Amenity created successfully",
    amenity,
  );
});

export const updateAmenityHandler = asyncHandler(async (req, res) => {
  const amenity = await amenityService.updateAmenity(
    req.params.id,
    req.body,
    req.user,
  );
  return successResponse(
    res,
    STATUS_CODES.OK,
    "Amenity updated successfully",
    amenity,
  );
});

export const deleteAmenityHandler = asyncHandler(async (req, res) => {
  await amenityService.deleteAmenity(req.params.id, req.user);
  return successResponse(res, STATUS_CODES.OK, "Amenity deleted successfully");
});
