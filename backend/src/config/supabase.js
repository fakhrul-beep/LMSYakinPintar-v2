import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Missing Supabase URL or Key in environment variables!");
  // Kita tidak throw error di sini agar server tetap bisa jalan untuk pengecekan /health
  // Tapi fitur yang butuh database akan gagal.
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default supabase;
