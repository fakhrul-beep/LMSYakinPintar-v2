import { FRONTEND_URL } from "./config/env.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.js";
import tutorRoutes from "./routes/tutors.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";
import reportRoutes from "./routes/reports.js";
import financeRoutes from "./routes/finance.js";
import leadRoutes from "./routes/leads.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import programRoutes from "./routes/programs.js";
import supabase from "./config/supabase.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/AppError.js";
import logger from "./utils/logger.js";

const app = express();

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests in dev
  })
);

// CORS configuration
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
// CORS pre-flight
app.options("*", cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize()); // Removed for Supabase migration

// Prevent HTTP Parameter Pollution
app.use(hpp());
app.use(morgan("dev"));

// Log every request for debugging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get("/api/health", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
    res.json({ 
      status: "ok", 
      message: "YakinPintar API is running",
      database: "connected"
    });
  } catch (err) {
    logger.error("Health check failed", err);
    res.status(503).json({ 
      status: "error", 
      message: "Service unavailable",
      database: "disconnected"
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/programs", programRoutes);

// 404 handler Handler
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
