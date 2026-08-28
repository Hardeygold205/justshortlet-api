import express from "express";
import helmet from "helmet";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

import activityRoutes from "./modules/activity/activity.route.js";
import adminRoutes from "./modules/admin/admin.route.js";
import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/user/user.route.js";
import uploadRoutes from "./modules/upload/upload.route.js";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import "./config/postgres.js";
import "./config/mysql.js";
import "./config/redis.js";
import "./config/multer.js";
import "./config/cloudinary.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: ["http://localhost:4200"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Rate limiting
app.use("/api", apiLimiter);

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running", statusCode: 200 });
});
app.use("/api/admins", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(errorHandler);

export default app;
