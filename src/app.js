import express from "express";
import helmet from "helmet";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

import "./config/db.js";
import "./config/redis.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// Rate limiting
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running", statusCode: 200 });
});

app.use("/api/auth", authRoutes);
app.use("api/users", userRoutes);

app.use(errorHandler);

export default app;
