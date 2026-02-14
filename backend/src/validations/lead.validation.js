import { z } from "zod";

export const studentLeadSchema = z.object({
  body: z.object({
    parentName: z.string().min(3, "Parent name must be at least 3 characters"),
    whatsapp: z.string().min(10, "WhatsApp number must be at least 10 digits").regex(/^[0-9]+$/, "WhatsApp number must contain only digits"),
    studentName: z.string().min(1, "Student name is required"),
    grade: z.enum(["Preschool/TK", "SD", "SMP", "SMA/SMK"]),
    program: z.string().min(1, "Program is required"),
    city: z.string().min(1, "City is required"),
    area: z.string().min(1, "Area is required"),
    schedulePreference: z.string().optional(),
  }),
});

export const tutorLeadSchema = z.object({
  body: z.object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    whatsapp: z.string().min(10, "Nomor WhatsApp minimal 10 digit").regex(/^[0-9]+$/, "Nomor WhatsApp hanya boleh berisi angka"),
    email: z.string().email("Alamat email tidak valid"),
    education: z.string().min(1, "Pendidikan terakhir wajib diisi"),
    experience: z.string().min(1, "Pengalaman mengajar wajib diisi"),
    subjects: z.string().min(1, "Mata pelajaran wajib diisi"),
    studentGrades: z.array(z.string()).min(1, "Pilih minimal satu jenjang siswa"),
    hourlyRate: z.string().min(1, "Tarif per jam wajib diisi"),
    city: z.string().min(1, "Kota domisili wajib diisi"),
    area: z.string().min(1, "Area/Kecamatan wajib diisi"),
    availability: z.string().min(1, "Ketersediaan waktu wajib diisi"),
    photoUrl: z.string().optional(),
    cvUrl: z.string().optional(),
    certificateUrl: z.string().optional(),
  }),
});
