import { z } from "zod";
import { AppError } from "../utils/AppError.js";
import logger from "../utils/logger.js";

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = err.errors ? Object.values(err.errors).map((el) => el.message) : [err.message];
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleZodError = (err) => {
  let errors = [];
  
  if (err.errors && Array.isArray(err.errors)) {
    errors = err.errors.map((e) => ({
      path: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
      message: e.message,
    }));
  } else if (typeof err.message === 'string' && err.message.startsWith('[')) {
    try {
      const parsed = JSON.parse(err.message);
      if (Array.isArray(parsed)) {
        errors = parsed.map((e) => ({
          path: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
          message: e.message,
        }));
      }
    } catch (e) {
      // Fallback if parsing fails
    }
  }

  if (errors.length === 0) {
    errors = [{ path: "unknown", message: err.message }];
  }

  const message = `Validation Error: ${errors.map(e => e.message).join(", ")}`;
  const error = new AppError(message, 400, errors);
  error.status = 'fail';
  return error;
};

const handlePostgresError = (err) => {
  // PostgREST/Postgres error codes: https://postgrest.org/en/stable/references/errors.html
  if (err.code === '23505') { // unique_violation
    return new AppError("Data duplikat terdeteksi. Silakan gunakan data lain.", 400);
  }
  if (err.code === '23503') { // foreign_key_violation
    return new AppError("Referensi data tidak valid atau data terkait tidak ditemukan.", 400);
  }
  if (err.code === '23502') { // not_null_violation
    return new AppError(`Data wajib tidak boleh kosong: ${err.column || ''}`, 400);
  }
  if (err.code === 'PGRST116') { // no rows found for .single()
    return new AppError("Data tidak ditemukan.", 404);
  }
  if (err.code === 'PGRST204' || err.message?.includes('schema cache')) { // Schema cache mismatch
    return new AppError("Sinkronisasi skema database sedang berlangsung. Silakan coba lagi dalam 5-10 detik.", 503);
  }
  return new AppError(err.message || "Terjadi kesalahan pada database.", 500);
};

export const globalErrorHandler = (err, req, res, next) => {
  let error;
  
  // 1. Identify and handle specific errors
  const isZod = err.name === "ZodError" || err.constructor?.name === "ZodError" || (err.errors && Array.isArray(err.errors));

  if (isZod) {
    error = handleZodError(err);
  } else if (err.code || err.hint) {
    error = handlePostgresError(err);
  } else if (err.name === "CastError") {
    error = handleCastErrorDB(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  } else if (err.name === "ValidationError") {
    error = handleValidationErrorDB(err);
  } else if (err instanceof AppError) {
    error = err;
  } else {
    // Clone original error for non-AppError
    error = { ...err };
    error.message = err.message;
    error.stack = err.stack;
    error.name = err.name;
    error.statusCode = err.statusCode || 500;
    error.isOperational = err.isOperational || false;
  }

  // Ensure mandatory properties
  error.statusCode = error.statusCode || 500;
  error.status = error.status || (error.statusCode.toString().startsWith('4') ? 'fail' : 'error');

  // Log error for internal monitoring
  if (error.statusCode >= 500) {
    logger.error("Internal Server Error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    logger.warn("Operational Error:", {
      statusCode: error.statusCode,
      message: error.message,
      path: req.path
    });
  }

  // 3. Send error response
  if (process.env.NODE_ENV === "test") {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      errors: error.errors,
      error: error
    });
  }

  if (process.env.NODE_ENV === "development") {
    res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
    });
  } else {
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        errors: error.errors
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan sistem internal. Silakan coba lagi nanti.",
      });
    }
  }
};
