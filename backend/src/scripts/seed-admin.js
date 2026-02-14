import 'dotenv/config';
import supabase from "../config/supabase.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

/**
 * Script untuk inisialisasi user admin utama
 * Email: admin@yakinpintar.com
 * Password: @OurProject123
 */
async function seedAdmin() {
  const email = "admin@yakinpintar.com";
  const password = "@OurProject123";
  const name = "Super Admin";

  try {
    logger.info(`Memeriksa apakah user ${email} sudah ada...`);

    // 1. Cek apakah user sudah ada
    const { data: existing, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      logger.info(`User ${email} sudah ada. Melakukan update password...`);
      const passwordHash = await bcrypt.hash(password, 10);
      
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          password_hash: passwordHash,
          role: "admin",
          name: name
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
      logger.info(`Password untuk ${email} berhasil diperbarui.`);
    } else {
      logger.info(`User ${email} belum ada. Membuat user baru...`);
      const passwordHash = await bcrypt.hash(password, 10);

      const { data: user, error: createError } = await supabase
        .from("users")
        .insert({
          name,
          email,
          password_hash: passwordHash,
          role: "admin"
        })
        .select()
        .single();

      if (createError) throw createError;
      logger.info(`User ${email} berhasil dibuat dengan ID: ${user.id}`);
    }

    logger.info("Proses seeding admin selesai dengan sukses.");
    process.exit(0);
  } catch (error) {
    logger.error("Gagal melakukan seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
