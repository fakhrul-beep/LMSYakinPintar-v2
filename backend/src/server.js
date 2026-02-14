import 'dotenv/config';
// import mongoose from "mongoose"; // Mongoose removed for Supabase migration
import app from "./app.js";
import logger from "./utils/logger.js";
import rateLimit from "express-rate-limit";
import supabase from "./config/supabase.js"; // Import Supabase client

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
  if (process.env.NODE_ENV === 'production') return; // Don't run app.listen in production (Vercel handles it)
  try {
    // Check Supabase connection (lightweight check)
    // We can't easily "ping" Supabase without a query, but the client init is enough to start.
    if (supabase) {
        logger.info("Supabase client initialized");
    }

    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
