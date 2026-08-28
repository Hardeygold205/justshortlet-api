import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import {
  adminIdParamSchema,
  createAdminSchema,
  updateAdminSchema,
} from "../schema/admin.schema.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  socialLoginSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
  emailOtpRequestSchema,
  emailOtpVerifySchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "../schema/auth.schema.js";
import {
  updateMeSchema,
  getUserByIdSchema,
  getUsersSchema,
  updateProfileMediaSchema,
  changePasswordSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  requestVerifyEmailSchema,
  requestVerifyPhoneSchema,
  adminUpdateUserSchema,
} from "../schema/user.schema.js";
import { uploadFileSchema, deleteFileSchema } from "../schema/upload.schema.js";
import { UPLOAD_FOLDERS } from "../constants/upload.js";
import {
  userActivitiesSchema,
  listActivitiesSchema,
} from "../schema/activity.schema.js";

const registry = new OpenAPIRegistry();

// ─────────────────────────────────────────────
// SECURITY SCHEME (for bearerAuth references above)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register with email and password",
  request: {
    body: {
      content: { "application/json": { schema: registerSchema.shape.body } },
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
      content: { "application/json": { schema: loginSchema.shape.body } },
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
        "application/json": { schema: refreshTokenSchema.shape.body },
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
      content: { "application/json": { schema: socialLoginSchema.shape.body } },
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
        "application/json": { schema: phoneOtpRequestSchema.shape.body },
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
        "application/json": { schema: phoneOtpVerifySchema.shape.body },
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
        "application/json": { schema: emailOtpRequestSchema.shape.body },
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
        "application/json": { schema: emailOtpVerifySchema.shape.body },
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
        "application/json": { schema: forgotPasswordSchema.shape.body },
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
        "application/json": { schema: resetPasswordSchema.shape.body },
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

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

registry.registerPath({
  method: "patch",
  path: "/users/me",
  tags: ["User"],
  summary: "Update current user profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: updateMeSchema.shape.body } },
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
    params: adminUpdateUserSchema.shape.params,
    body: {
      content: {
        "application/json": { schema: adminUpdateUserSchema.shape.body },
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
  request: { params: getUserByIdSchema.shape.params },
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
  request: { query: getUsersSchema.shape.query },
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
    params: updateProfileMediaSchema.shape.params,
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
          schema: changePasswordSchema.shape.body,
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
        "application/json": { schema: requestVerifyEmailSchema.shape.body },
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
      content: { "application/json": { schema: verifyEmailSchema.shape.body } },
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
        "application/json": { schema: requestVerifyPhoneSchema.shape.body },
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
      content: { "application/json": { schema: verifyPhoneSchema.shape.body } },
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
