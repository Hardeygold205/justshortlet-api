import express from "express";
import helmet from "helmet";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware.js";

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
import "./config/supabase.js";

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
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Rate limiting
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running", statusCode: 200 });
});

app.use("/api/uploads", uploadRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

export default app;
