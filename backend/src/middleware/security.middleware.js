import logger from "../utils/logger.js";
import { registerSchema } from "../utils/validators.js";

/**
 * Validates request body using Zod schema
 */
export const validateRegister = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    const errorDetails = error.errors || [];
    logger.warn(`Registrasi gagal: validasi input tidak lolos. Error: ${JSON.stringify(errorDetails)}`);
    return res.status(400).json({
      status: "fail",
      message: "Validasi input gagal",
      errors: errorDetails.map(err => ({
        path: err.path[0],
        message: err.message
      }))
    });
  }
};

/**
 * Logs user creation activity
 */
export const logUserCreation = (req, res, next) => {
  const { name, email, role } = req.body;
  const creatorId = req.user ? req.user.id : "system";
  const creatorName = req.user ? req.user.name : "System Seeder";

  // Simpan log ke file (melalui winston)
  logger.info(`USER_CREATION: User baru dibuat. Nama: ${name}, Email: ${email}, Role: ${role}. Dibuat oleh: ${creatorName} (${creatorId})`);
  
  // Catatan: Di produksi, Anda mungkin ingin menyimpan ini ke tabel 'audit_logs' di database
  next();
};
