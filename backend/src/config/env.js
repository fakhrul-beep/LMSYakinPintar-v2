import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_KEY;
export const PORT = process.env.PORT || 5000;
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
