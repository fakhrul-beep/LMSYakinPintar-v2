import supabase from "../config/supabase.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import logger from "../utils/logger.js";

// Simple In-Memory Cache for Specializations
const specCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getSpecializationsBySubject = catchAsync(async (req, res, next) => {
  const { mataPelajaranId } = req.params;

  if (!mataPelajaranId) {
    return next(new AppError("Mata pelajaran ID harus disediakan", 400));
  }

  // Check Cache
  const cachedData = specCache.get(mataPelajaranId);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
    return res.status(200).json({
      status: "success",
      source: "cache",
      data: cachedData.data
    });
  }

  // Verify Subject exists
  const { data: subject, error: subError } = await supabase
    .from("mata_pelajaran")
    .select("id, name")
    .eq("id", mataPelajaranId)
    .single();

  if (subError || !subject) {
    return next(new AppError("Mata pelajaran tidak ditemukan", 404));
  }

  // Get correlated specializations
  const { data, error } = await supabase
    .from("mata_pelajaran_spesialisasi")
    .select(`
      spesialisasi (
        id,
        name
      )
    `)
    .eq("mata_pelajaran_id", mataPelajaranId);

  if (error) {
    logger.error("Error fetching specializations:", error);
    return next(new AppError("Gagal mengambil data spesialisasi", 500));
  }

  const specializations = data.map(item => item.spesialisasi).filter(Boolean);

  // Update Cache
  specCache.set(mataPelajaranId, {
    timestamp: Date.now(),
    data: specializations
  });

  res.status(200).json({
    status: "success",
    source: "db",
    data: specializations
  });
});

export const getAllSubjects = catchAsync(async (req, res, next) => {
  const { data, error } = await supabase
    .from("mata_pelajaran")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error fetching subjects:", error);
    return next(new AppError("Gagal mengambil data mata pelajaran", 500));
  }

  res.status(200).json({
    status: "success",
    data
  });
});

/**
 * Middleware to validate subject-specialization correlation before saving
 */
export const validateCorrelation = catchAsync(async (req, res, next) => {
  const { mataPelajaranId, spesialisasiId, userId } = req.body;

  if (!mataPelajaranId || !spesialisasiId) {
    return next(new AppError("Mata pelajaran ID dan Spesialisasi ID harus disediakan", 400));
  }

  const { data, error } = await supabase
    .from("mata_pelajaran_spesialisasi")
    .select("id")
    .eq("mata_pelajaran_id", mataPelajaranId)
    .eq("spesialisasi_id", spesialisasiId)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Database error during correlation validation:", error);
    return next(new AppError("Gagal memvalidasi korelasi", 500));
  }

  if (!data) {
    // Log invalid attempt
    await supabase.from("correlation_errors").insert({
      user_id: userId || null,
      mata_pelajaran_id: mataPelajaranId,
      spesialisasi_id: spesialisasiId,
      error_type: "INVALID_CORRELATION",
      metadata: { source: "backend_validation" }
    });

    return res.status(200).json({
      status: "success",
      valid: false,
      message: "Spesialisasi yang dipilih tidak tersedia untuk mata pelajaran tersebut"
    });
  }

  res.status(200).json({
    status: "success",
    valid: true
  });
});

export const getCorrelationStats = catchAsync(async (req, res, next) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Get total attempts (valid + invalid)
  // This is a bit complex without a 'valid_attempts' table, 
  // so we'll just focus on tracking error rates if we had a total count.
  // For now, let's just get the error counts.

  const { data: errors, error: err } = await supabase
    .from("correlation_errors")
    .select("*")
    .gte("created_at", oneHourAgo);

  if (err) return next(new AppError("Gagal mengambil statistik", 500));

  // Simplified alert logic: check if error count is high
  // In a real app, this would be compared against total requests
  const errorCount = errors.length;
  const isHighRate = errorCount > 50;

  if (isHighRate) {
    logger.error("ALERT: High correlation error rate detected!", { count: errorCount });
  }

  res.status(200).json({
    status: "success",
    data: {
      recent_errors: errorCount,
      alert: isHighRate,
      errors: errors.slice(0, 10) // Last 10 errors
    }
  });
});
