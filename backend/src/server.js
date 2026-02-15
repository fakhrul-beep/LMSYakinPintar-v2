import 'dotenv/config';
// import mongoose from "mongoose"; // Mongoose removed for Supabase migration
import app from "./app.js";
import logger from "./utils/logger.js";
import rateLimit from "express-rate-limit";
import supabase from "./config/supabase.js"; // Import Supabase client
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required directories exist
const requiredDirs = [
  path.join(__dirname, '../logs'),
  path.join(__dirname, '../public/uploads')
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created missing directory: ${dir}`);
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { message: "Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/admin/login", loginLimiter);

const PORT = process.env.PORT || 4000;

// Export app for Vercel
export default app;

async function start() {
  try {
    // Check Supabase connection (lightweight check)
    if (supabase) {
      logger.info("Supabase client initialized");
    }

    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
