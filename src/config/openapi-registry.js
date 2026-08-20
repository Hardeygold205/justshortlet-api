import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  supabaseExchangeSchema,
} from "../schema/auth.schema.js";
import {
  updateMeSchema,
  getUserByIdSchema,
  getUsersSchema,
} from "../schema/user.schema.js";
import {
  uploadFileSchema,
  uploadAnyFileSchema,
  deleteFileSchema,
} from "../schema/upload.schema.js";

const registry = new OpenAPIRegistry();

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
  path: "/auth/supabase-exchange",
  tags: ["Auth"],
  summary: "Exchange Supabase token for app JWT",
  request: {
    body: {
      content: {
        "application/json": { schema: supabaseExchangeSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Returns app JWT tokens" },
    401: { description: "Invalid Supabase token" },
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
              folder: { type: "string", example: "posts" },
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
              folder: { type: "string", example: "posts" },
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
              folder: { type: "string", example: "posts" },
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
    info: { title: "MyApp API", version: "1.0.0" },
    servers: [{ url: "/api" }],
  });
};
