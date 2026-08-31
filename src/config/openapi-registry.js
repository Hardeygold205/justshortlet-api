import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import {
  adminIdParamSchema,
  createAdminSchema,
  updateAdminSchema,
} from "../schema/admin.schema.js";
import * as authSchema from "../schema/auth.schema.js";
import * as userSchema from "../schema/user.schema.js";
import { uploadFileSchema, deleteFileSchema } from "../schema/upload.schema.js";
import { UPLOAD_FOLDERS } from "../constants/upload.js";
import {
  userActivitiesSchema,
  listActivitiesSchema,
} from "../schema/activity.schema.js";
import * as schema from "../schema/property.schema.js";
import * as amenitySchema from "../schema/amenity.schema.js";

const registry = new OpenAPIRegistry();
const propertyBodySchema = schema.createPropertySchema.shape.body;

// SECURITY SCHEME (for bearerAuth references above)

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "JustShort App API documentations", version: "1.0.0" },
    servers: [{ url: "/api" }],
  });
};

// ADMINS

registry.registerPath({
  method: "post",
  path: "/admins",
  tags: ["Admin Management"],
  summary: "Create a new ADMIN or SUPER_ADMIN account (SUPER_ADMIN only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createAdminSchema.shape.body } },
    },
  },
  responses: {
    201: { description: "Admin created successfully" },
    403: { description: "Requires SUPER_ADMIN role" },
    409: { description: "Email already exists" },
  },
});

registry.registerPath({
  method: "get",
  path: "/admins",
  tags: ["Admin Management"],
  summary: "List all ADMIN and SUPER_ADMIN accounts",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Admins retrieved successfully" },
    403: { description: "Requires SUPER_ADMIN role" },
  },
});

registry.registerPath({
  method: "get",
  path: "/admins/{id}",
  tags: ["Admin Management"],
  summary: "Get a single admin by ID",
  security: [{ bearerAuth: [] }],
  request: { params: adminIdParamSchema.shape.params },
  responses: {
    200: { description: "Admin retrieved successfully" },
    404: { description: "Admin not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admins/{id}",
  tags: ["Admin Management"],
  summary: "Update an admin's role or status",
  security: [{ bearerAuth: [] }],
  request: {
    params: updateAdminSchema.shape.params,
    body: {
      content: { "application/json": { schema: updateAdminSchema.shape.body } },
    },
  },
  responses: {
    200: { description: "Admin updated successfully" },
    403: {
      description:
        "Cannot change own role, or would remove the last SUPER_ADMIN",
    },
    404: { description: "Admin not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admins/{id}",
  tags: ["Admin Management"],
  summary: "Delete an admin account",
  security: [{ bearerAuth: [] }],
  request: { params: adminIdParamSchema.shape.params },
  responses: {
    200: { description: "Admin deleted successfully" },
    403: { description: "Cannot delete self or the last SUPER_ADMIN" },
    404: { description: "Admin not found" },
  },
});

// AUTH

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register with email and password",
  request: {
    body: {
      content: {
        "application/json": { schema: authSchema.registerSchema.shape.body },
      },
    },
  },
  responses: {
    201: { description: "User registered successfully" },
    409: { description: "Email already exists" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login with email and password",
  request: {
    body: {
      content: {
        "application/json": { schema: authSchema.loginSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Login successful" },
    401: { description: "Invalid credentials" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.refreshTokenSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "New access token returned" },
    401: { description: "Invalid refresh token" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/social-login",
  tags: ["Auth"],
  summary: "Sign up or log in via Google/Apple",
  request: {
    body: {
      content: {
        "application/json": { schema: authSchema.socialLoginSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Login successful" },
    400: { description: "Unsupported provider or invalid token" },
    401: { description: "Invalid Google/Apple token" },
    409: { description: "Email already registered via a different provider" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/phone-otp/request",
  tags: ["Auth"],
  summary: "Request an OTP code for phone login or signup",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.phoneOtpRequestSchema.shape.body,
        },
      },
    },
  },
  responses: { 200: { description: "OTP sent" } },
});

registry.registerPath({
  method: "post",
  path: "/auth/phone-otp/verify",
  tags: ["Auth"],
  summary: "Verify phone OTP — signs up or logs in",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.phoneOtpVerifySchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Login successful" },
    400: { description: "Invalid or expired code" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/email-otp/request",
  tags: ["Auth"],
  summary: "Request an OTP code for email login or signup",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.emailOtpRequestSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "OTP sent" },
    409: { description: "Email already registered via a different provider" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/email-otp/verify",
  tags: ["Auth"],
  summary: "Verify email OTP — signs up or logs in",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.emailOtpVerifySchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Login successful" },
    400: { description: "Invalid or expired code" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  summary: "Request a password reset code (local provider only)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.forgotPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        "If an account exists with that email, a reset code has been sent.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Auth"],
  summary: "Reset password using the emailed code",
  request: {
    body: {
      content: {
        "application/json": {
          schema: authSchema.resetPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Password reset successfully" },
    400: { description: "Invalid or expired code" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout and blacklist token",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Logged out successfully" },
    401: { description: "Unauthorized" },
  },
});

// USERS

registry.registerPath({
  method: "patch",
  path: "/users/me",
  tags: ["User"],
  summary: "Update current user profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: userSchema.updateMeSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Profile updated" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/users/me/upgrade-to-host",
  tags: ["User"],
  summary: "Upgrade the current GUEST account to HOST",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Upgraded successfully, returns new tokens" },
    400: { description: "Account cannot be upgraded (already HOST/ADMIN)" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/{userId}",
  tags: ["User"],
  summary: "Admin: update a user's role (GUEST↔HOST) or status",
  security: [{ bearerAuth: [] }],
  request: {
    params: userSchema.adminUpdateUserSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: userSchema.adminUpdateUserSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "User updated successfully" },
    403: { description: "Not permitted, or target is an admin account" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["User"],
  summary: "Get current user",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "User found" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/users/{userId}",
  tags: ["User"],
  summary: "Get user by ID",
  security: [{ bearerAuth: [] }],
  request: { params: userSchema.getUserByIdSchema.shape.params },
  responses: {
    200: { description: "User found" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Delete a user account",
  security: [{ bearerAuth: [] }],
  request: { params: adminIdParamSchema.shape.params },
  responses: {
    200: { description: "User deleted successfully" },
    403: { description: "You have no permission to ddelete" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/users/me",
  tags: ["User"],
  summary: "Delete current user",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "User Deleted successfully" },
    403: { description: "Forbidden" },
    404: { description: "User not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  summary: "Get All users",
  security: [{ bearerAuth: [] }],
  request: { query: userSchema.getUsersSchema.shape.query },
  responses: {
    200: { description: "List of users" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/me/profile/{type}",
  tags: ["User"],
  summary:
    "Upload or replace the current user's avatar or banner (role-restricted)",
  security: [{ bearerAuth: [] }],
  request: {
    params: userSchema.updateProfileMediaSchema.shape.params,
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: { file: { type: "string", format: "binary" } },
            required: ["file"],
          },
        },
      },
    },
  },
  responses: {
    200: { description: "Media updated successfully" },
    400: { description: "No file uploaded or unsupported media type" },
    403: { description: "Role not permitted to upload this media type" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/me/update-password",
  tags: ["User"],
  summary: "Change the current user's password",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userSchema.changePasswordSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password updated successfully",
    },
    400: {
      description: "Missing fields, weak password, or same as current password",
    },
    401: { description: "Current password is incorrect" },
  },
});

registry.registerPath({
  method: "post",
  path: "/users/me/verify-email/request",
  tags: ["User"],
  summary: "Request a code to verify a new email on the current account",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userSchema.requestVerifyEmailSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Verification code sent to email" },
    409: { description: "Email already in use" },
  },
});

registry.registerPath({
  method: "post",
  path: "/users/me/verify-email/verify",
  tags: ["User"],
  summary: "Verify code and attach the email to the current account",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: userSchema.verifyEmailSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Email verified and added" },
    400: { description: "Invalid or expired code" },
    409: { description: "Email already in use" },
  },
});

registry.registerPath({
  method: "post",
  path: "/users/me/verify-phone/request",
  tags: ["User"],
  summary: "Request a code to verify a new phone on the current account",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userSchema.requestVerifyPhoneSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Verification code sent to phone" },
    409: { description: "Phone already in use" },
  },
});

registry.registerPath({
  method: "post",
  path: "/users/me/verify-phone/verify",
  tags: ["User"],
  summary: "Verify code and attach the phone to the current account",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: userSchema.verifyPhoneSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Phone verified and added" },
    400: { description: "Invalid or expired code" },
    409: { description: "Phone already in use" },
  },
});

// ACTIVITY

registry.registerPath({
  method: "get",
  path: "/activities",
  tags: ["Activity"],
  summary: "List all activities across the platform (ADMIN/SUPER_ADMIN only)",
  security: [{ bearerAuth: [] }],
  request: { query: listActivitiesSchema.shape.query },
  responses: {
    200: { description: "Activities fetched successfully" },
    403: { description: "Requires ADMIN or SUPER_ADMIN role" },
  },
});

registry.registerPath({
  method: "get",
  path: "/activities/user/{userId}",
  tags: ["Activity"],
  summary:
    "Get a user's activity — self, or ADMIN/SUPER_ADMIN viewing any user",
  security: [{ bearerAuth: [] }],
  request: {
    params: userActivitiesSchema.shape.params,
    query: userActivitiesSchema.shape.query,
  },
  responses: {
    200: { description: "Activities fetched successfully" },
    403: { description: "Not permitted to view this user's activities" },
  },
});

// UPLOADS

registry.registerPath({
  method: "post",
  path: "/uploads/single/{category}",
  tags: ["Uploads"],
  summary: "Upload a single file (image, video, audio, or doc)",
  security: [{ bearerAuth: [] }],
  request: {
    params: uploadFileSchema.shape.params,
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: { type: "string", format: "binary" },
              folder: {
                type: "string",
                enum: UPLOAD_FOLDERS,
                default: "general",
                example: "posts",
              },
            },
            required: ["file"],
          },
        },
      },
    },
  },
  responses: {
    201: { description: "File uploaded successfully" },
    400: { description: "Invalid file type, size, or category" },
  },
});

registry.registerPath({
  method: "post",
  path: "/uploads/multiple/{category}",
  tags: ["Uploads"],
  summary: "Upload multiple files of the same category (max 10)",
  security: [{ bearerAuth: [] }],
  request: {
    params: uploadFileSchema.shape.params,
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: { type: "string", format: "binary" },
              },
              folder: {
                type: "string",
                enum: UPLOAD_FOLDERS,
                default: "general",
                example: "posts",
              },
            },
            required: ["files"],
          },
        },
      },
    },
  },
  responses: {
    201: { description: "Files uploaded successfully" },
    400: { description: "Invalid file type, size, or category" },
  },
});

registry.registerPath({
  method: "post",
  path: "/uploads/any",
  tags: ["Uploads"],
  summary: "Upload any accepted file type(s), single or multiple",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: { type: "string", format: "binary" },
              },
              folder: {
                type: "string",
                enum: UPLOAD_FOLDERS,
                default: "general",
                example: "posts",
              },
            },
            required: ["files"],
          },
        },
      },
    },
  },
  responses: {
    201: { description: "File(s) uploaded successfully" },
    400: { description: "Unsupported file type" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/uploads",
  tags: ["Uploads"],
  summary: "Delete a previously uploaded file",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: deleteFileSchema.shape.body } },
    },
  },
  responses: {
    200: { description: "File deleted successfully" },
    400: { description: "Invalid identifier" },
  },
});

// PROPERTIES

registry.registerPath({
  method: "post",
  path: "/properties/mine",
  tags: ["Properties"],
  summary: "Create a new property listing (HOST only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: propertyBodySchema } } },
  },
  responses: {
    201: { description: "Property created successfully" },
    403: { description: "Requires HOST role" },
  },
});

registry.registerPath({
  method: "get",
  path: "/properties/mine/list",
  tags: ["Properties"],
  summary: "List the current host's properties",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Properties fetched successfully" } },
});

registry.registerPath({
  method: "get",
  path: "/properties/mine/{id}",
  tags: ["Properties"],
  summary: "Get one of the current host's properties by id",
  security: [{ bearerAuth: [] }],
  request: { params: schema.propertyIdParamSchema.shape.params },
  responses: {
    200: { description: "Property fetched successfully" },
    404: { description: "Property not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/properties/mine/{id}",
  tags: ["Properties"],
  summary: "Update a property (resets to DRAFT if it was published/pending)",
  security: [{ bearerAuth: [] }],
  request: {
    params: schema.updatePropertySchema.shape.params,
    body: {
      content: {
        "application/json": { schema: schema.updatePropertySchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Property updated successfully" },
    403: { description: "Not authorized to edit this property" },
    404: { description: "Property not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/properties/mine/{id}",
  tags: ["Properties"],
  summary: "Delete a property (fails if it has active bookings)",
  security: [{ bearerAuth: [] }],
  request: { params: schema.propertyIdParamSchema.shape.params },
  responses: {
    200: { description: "Property deleted successfully" },
    409: { description: "Cannot delete a property with active bookings" },
  },
});

registry.registerPath({
  method: "post",
  path: "/properties/mine/{id}/submit",
  tags: ["Properties"],
  summary: "Submit a DRAFT/REJECTED property for admin review",
  security: [{ bearerAuth: [] }],
  request: { params: schema.propertyIdParamSchema.shape.params },
  responses: {
    200: { description: "Property submitted for review" },
    400: { description: "Wrong status, or fewer than 3 photos uploaded" },
  },
});

registry.registerPath({
  method: "post",
  path: "/properties/mine/{id}/block-dates",
  tags: ["Properties"],
  summary: "Block dates on a property (maintenance, personal use, etc.)",
  security: [{ bearerAuth: [] }],
  request: {
    params: schema.blockDatesSchema.shape.params,
    body: {
      content: {
        "application/json": { schema: schema.blockDatesSchema.shape.body },
      },
    },
  },
  responses: {
    201: { description: "Dates blocked successfully" },
    409: { description: "Dates overlap an existing booking or block" },
  },
});

registry.registerPath({
  method: "get",
  path: "/properties",
  tags: ["Properties"],
  summary: "Browse published properties (public)",
  request: { query: schema.listPropertiesSchema.shape.query },
  responses: { 200: { description: "Properties fetched successfully" } },
});

registry.registerPath({
  method: "get",
  path: "/properties/{id}",
  tags: ["Properties"],
  summary: "Get a published property by id or slug (public)",
  request: {
    params: schema.publicPropertyParamSchema.shape.params,
  },
  responses: {
    200: { description: "Property fetched successfully" },
    404: { description: "Property not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/properties/{id}/calendar",
  tags: ["Properties"],
  summary: "Get booked/blocked date ranges for a property (public)",
  request: {
    params: schema.calendarQuerySchema.shape.params,
    query: schema.calendarQuerySchema.shape.query,
  },
  responses: { 200: { description: "Calendar fetched successfully" } },
});

registry.registerPath({
  method: "get",
  path: "/admin/properties",
  tags: ["Admin Properties"],
  summary: "List all properties, any status (ADMIN/SUPER_ADMIN only)",
  security: [{ bearerAuth: [] }],
  request: { query: schema.adminListPropertiesSchema.shape.query },
  responses: { 200: { description: "Properties fetched successfully" } },
});

registry.registerPath({
  method: "patch",
  path: "/admin/properties/{id}/status",
  tags: ["Admin Properties"],
  summary: "Approve, reject, suspend, or archive a property",
  security: [{ bearerAuth: [] }],
  request: {
    params: schema.adminUpdateStatusSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: schema.adminUpdateStatusSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Property status updated successfully" },
    400: { description: "Missing rejectionReason when status is REJECTED" },
  },
});

registry.registerPath({
  method: "post",
  path: "/properties/mine/{id}/images",
  tags: ["Properties"],
  summary: "Attach previously uploaded images to a property",
  description:
    "Links Upload records (from /uploads/multiple/{category}) to this property. " +
    "The first image ever attached is automatically set as the cover image.",
  security: [{ bearerAuth: [] }],
  request: {
    params: schema.attachImagesSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: schema.attachImagesSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: { description: "Images attached successfully" },
    400: { description: "One or more uploads not found or not owned by you" },
    403: { description: "Not authorized to edit this property" },
    404: { description: "Property not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/properties/mine/{id}/images/{imageId}/cover",
  tags: ["Properties"],
  summary: "Set a specific property image as the cover image",
  security: [{ bearerAuth: [] }],
  request: {
    params: schema.setCoverImageSchema.shape.params,
  },
  responses: {
    200: { description: "Cover image updated" },
    403: { description: "Not authorized to edit this property" },
    404: { description: "Property or image not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/properties/mine/{id}/images/{imageId}",
  tags: ["Properties"],
  summary: "Remove an image from a property",
  description:
    "Unlinks the image from the property. Does not delete the underlying " +
    "Cloudinary asset. If the removed image was the cover, the next image " +
    "(by sort order) is automatically promoted to cover.",
  security: [{ bearerAuth: [] }],
  request: {
    params: schema.deletePropertyImageSchema.shape.params,
  },
  responses: {
    200: { description: "Image removed successfully" },
    403: { description: "Not authorized to edit this property" },
    404: { description: "Property or image not found" },
  },
});

// AMENITIES

registry.registerPath({
  method: "get",
  path: "/amenities",
  tags: ["Amenities"],
  summary: "List all available amenities (public)",
  responses: { 200: { description: "Amenities fetched successfully" } },
});

registry.registerPath({
  method: "post",
  path: "/amenities",
  tags: ["Amenities"],
  summary: "Create a new amenity (ADMIN/SUPER_ADMIN only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: amenitySchema.createAmenitySchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: { description: "Amenity created successfully" },
    409: { description: "Slug already exists" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/amenities/{id}",
  tags: ["Amenities"],
  summary: "Update an amenity (ADMIN/SUPER_ADMIN only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: amenitySchema.updateAmenitySchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: amenitySchema.updateAmenitySchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Amenity updated successfully" },
    404: { description: "Amenity not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/amenities/{id}",
  tags: ["Amenities"],
  summary: "Delete an amenity (ADMIN/SUPER_ADMIN only)",
  security: [{ bearerAuth: [] }],
  request: { params: amenitySchema.amenityIdParamSchema.shape.params },
  responses: {
    200: { description: "Amenity deleted successfully" },
    409: { description: "Amenity is attached to existing properties" },
  },
});
