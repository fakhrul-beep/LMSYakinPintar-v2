import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";
import { withRetry } from "../utils/supabaseRetry.js";

import { JWT_SECRET } from "../config/env.js";

export const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, whatsapp, grade, program, city } = req.body;

    if (!name || !email || !password || !whatsapp) {
      return next(new AppError("Missing required fields", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    logger.info(`Attempting to register student: ${normalizedEmail}`);

    const passwordHash = await bcrypt.hash(password, 10);

    // Use RPC for atomic creation
    const { data, error: rpcError } = await withRetry(
      () =>
        supabase.rpc("create_student_v1", {
          p_name: name || null,
          p_email: normalizedEmail || null,
          p_password_hash: passwordHash || null,
          p_whatsapp: whatsapp || null,
          p_grade: grade || null,
          p_program: program || null,
          p_city: city || null,
          p_is_active: true
        }),
      { 
        context: "registerStudent:rpc",
        // Specific error message that indicates a schema mismatch in PostgREST
        retryableMessages: [
          "column \"user_id\" of relation \"students\" does not exist", 
          "column \"parent_id\" of relation \"students\" does not exist",
          "column \"program\" of relation \"students\" does not exist",
          "column \"is_active\" of relation \"students\" does not exist",
          "column \"city\" of relation \"students\" does not exist"
        ]
      }
    );

    if (rpcError) {
      logger.error(`RPC Execution Error in registerStudent: ${rpcError.message}`, {
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint,
        email: normalizedEmail
      });
      return next(new AppError("Gagal mendaftarkan siswa karena kendala koneksi database.", 500));
    }

    if (data && data.status === "error") {
      logger.warn(`Business Logic Error in registerStudent RPC: ${data.message}`, {
        email: normalizedEmail,
        code: data.code,
        hint: data.hint
      });

      // Provide more helpful messages based on SQL error codes or messages
      let errorMessage = data.message;
      let statusCode = 400;

      if (data.message.includes("Email sudah terdaftar") || data.message.includes("Siswa sudah terdaftar")) {
        statusCode = 409;
        errorMessage = "Email ini sudah terdaftar. Silakan gunakan email lain atau login ke akun Anda.";
      } else if (data.message.includes("column \"user_id\" of relation \"students\" does not exist") || 
                 data.message.includes("column \"parent_id\" of relation \"students\" does not exist") ||
                 data.message.includes("column \"program\" of relation \"students\" does not exist") ||
                 data.message.includes("column \"is_active\" of relation \"students\" does not exist") ||
                 data.message.includes("column \"city\" of relation \"students\" does not exist")) {
        
        logger.error("CRITICAL: Database schema mismatch detected in registerStudent RPC", { 
          email: normalizedEmail, 
          error: data.message,
          code: data.code,
          hint: data.hint
        });
        errorMessage = "Terjadi kendala sinkronisasi pada sistem pendaftaran. Tim teknis kami telah dinotifikasi. Silakan coba lagi dalam beberapa menit.";
        statusCode = 500;
      } else {
        errorMessage = "Gagal mendaftarkan akun. Silakan periksa kembali data Anda atau hubungi dukungan jika masalah berlanjut.";
      }

      return next(new AppError(errorMessage, statusCode));
    }

    const token = jwt.sign(
      { id: data.data.user_id, role: "student", name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`Student registered: ${normalizedEmail}`, { studentId: data.data.id });

    res.status(201).json({
      status: "success",
      token,
      user: {
        id: data.data.user_id,
        name,
        email: normalizedEmail,
        role: "student"
      },
      student: {
        id: data.data.id,
        user_id: data.data.user_id,
        name,
        grade,
        program,
        city,
        is_active: true
      }
    });
  } catch (error) {
    logger.error("Register student error", { error });
    next(error);
  }
};

export const registerTutor = async (req, res, next) => {
  try {
    const { 
      name, email, password, whatsapp, 
      education, experience, subjects, 
      studentGrades, hourlyRate, city, area, availability 
    } = req.body;

    if (!name || !email || !password || !whatsapp) {
      return next(new AppError("Missing required fields", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    logger.info(`Attempting to register tutor: ${normalizedEmail}`);

    const passwordHash = await bcrypt.hash(password, 10);

    // Handle File Uploads
    let profilePhotoUrl = null;
    if (req.files && req.files.photo) {
      const file = req.files.photo[0];
      profilePhotoUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
    }

    // Parse numeric fields
    const numericHourlyRate = hourlyRate ? parseFloat(String(hourlyRate).replace(/[^0-9]/g, "")) : 0;

    // Use RPC for atomic creation
    const { data, error: rpcError } = await withRetry(
      () =>
        supabase.rpc("create_tutor_v2", {
          p_name: name || null,
          p_email: normalizedEmail || null,
          p_password_hash: passwordHash || null,
          p_whatsapp: whatsapp || null,
          p_education: education || null,
          p_experience: experience || null,
          p_subjects: Array.isArray(subjects) ? subjects : (subjects ? String(subjects).split(",").map(s => s.trim()) : []),
          p_student_grades: Array.isArray(studentGrades) ? studentGrades : (studentGrades ? String(studentGrades).split(",").map(s => s.trim()) : []),
          p_hourly_rate: numericHourlyRate,
          p_city: city || null,
          p_area: area || null,
          p_availability: availability || null,
          p_profile_photo: profilePhotoUrl,
          p_is_active: true
        }),
      { context: "registerTutor:rpc" }
    );

    if (rpcError) {
      logger.error("RPC Error in registerTutor", { 
        email: normalizedEmail, 
        error: rpcError,
        stack: new Error().stack 
      });
      return next(new AppError("Gagal mendaftarkan guru karena kendala database.", 500));
    }

    if (data.status === "error") {
      logger.warn("Validation error in registerTutor RPC", { email: normalizedEmail, message: data.message });
      return next(new AppError(data.message, data.message.includes("sudah terdaftar") ? 409 : 400));
    }

    const token = jwt.sign(
      { id: data.data.user_id, role: "tutor", name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`Tutor registered: ${normalizedEmail}`, { tutorId: data.data.id });

    res.status(201).json({
      status: "success",
      token,
      user: {
        id: data.data.user_id,
        name,
        email: normalizedEmail,
        role: "tutor"
      },
      tutor: {
        id: data.data.id,
        user_id: data.data.user_id,
        education,
        experience,
        subjects: Array.isArray(subjects) ? subjects : (subjects ? String(subjects).split(",").map(s => s.trim()) : []),
        student_grades: Array.isArray(studentGrades) ? studentGrades : (studentGrades ? String(studentGrades).split(",").map(s => s.trim()) : []),
        hourly_rate: numericHourlyRate,
        city,
        area,
        profile_photo: profilePhotoUrl,
        is_active: true
      }
    });
  } catch (error) {
    logger.error("Register tutor error", { error });
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError("Email dan password harus diisi", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !user) {
      logger.warn(`Login failed: User not found for email ${normalizedEmail}`);
      return next(new AppError("Email atau password salah", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for email ${normalizedEmail}`);
      return next(new AppError("Email atau password salah", 401));
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`Login successful: ${normalizedEmail} (${user.role})`);

    res.json({
      status: "success",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};
