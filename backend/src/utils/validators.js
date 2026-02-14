import { z } from "zod";

// RFC 5322 compliant email regex (simplified but robust for common use cases)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Password policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung setidaknya satu huruf besar")
  .regex(/[a-z]/, "Password harus mengandung setidaknya satu huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka")
  .regex(/[^A-Za-z0-9]/, "Password harus mengandung setidaknya satu simbol spesial");

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().regex(emailRegex, "Format email tidak valid (RFC 5322)"),
  password: passwordSchema,
  role: z.enum(["parent", "student", "tutor", "admin"], {
    errorMap: () => ({ message: "Role tidak valid" }),
  }),
  whatsapp: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().regex(emailRegex, "Format email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});
