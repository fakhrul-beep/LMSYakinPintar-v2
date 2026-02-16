import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Missing Supabase URL or Key in environment variables!");
  console.error("Please ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file or production environment.");
  console.error("Current SUPABASE_URL:", supabaseUrl ? "Defined" : "UNDEFINED");
  console.error("Current SUPABASE_KEY:", supabaseKey ? "Defined" : "UNDEFINED");
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully.");
  } catch (error) {
    console.error("FAILED to initialize Supabase client:", error.message);
  }
}

export default supabase;
