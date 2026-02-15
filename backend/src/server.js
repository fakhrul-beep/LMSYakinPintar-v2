import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Early directory creation
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

import app from "./app.js";
import logger from "./utils/logger.js";
import rateLimit from "express-rate-limit";
import supabase from "./config/supabase.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/admin/login", loginLimiter);

const PORT = process.env.PORT || 4000;

export default app;

async function start() {
  try {
    console.log(`[Startup] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Startup] Port: ${PORT}`);
    
    if (supabase) {
      logger.info("Supabase client initialized successfully");
    } else {
      const missing = [];
      if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
      if (!process.env.SUPABASE_KEY) missing.push("SUPABASE_KEY");
      logger.warn(`Supabase client NOT initialized. Missing: ${missing.join(", ")}`);
    }

    app.listen(PORT, () => {
      logger.info(`Server is UP and running on port ${PORT}`);
      logger.info(`Health check available at /api/health`);
    });
  } catch (err) {
    console.error("FATAL ERROR DURING STARTUP:", err);
    if (logger) logger.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
