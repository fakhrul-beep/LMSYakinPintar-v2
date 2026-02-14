import supabase from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import { withRetry } from "../utils/supabaseRetry.js";

/**
 * Synchronize a lead to the students table using atomic RPC
 * @param {string} leadId 
 */
const syncLeadToStudent = async (leadId) => {
  logger.info(`Starting synchronization for lead: ${leadId}`);
  
  // 1. Fetch lead data
  const { data: lead, error: leadError } = await withRetry(
    () => supabase.from("leads").select("*").eq("id", leadId).single(),
    { context: "syncLeadToStudent:fetchLead" }
  );

  if (leadError || !lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  if (lead.type !== 'student') {
    logger.info(`Skipping sync for non-student lead: ${leadId}`);
    return;
  }

  const payload = lead.payload;
  const rawEmail = payload.email || `${payload.whatsapp}@yakinpintar.com`;
  const normalizedEmail = rawEmail.toLowerCase().trim();
  const name = payload.studentName || payload.parentName;

  // 2. Generate random password for the new student
  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // 3. Use RPC for atomic creation of both user and student records
  const { data, error: rpcError } = await withRetry(
    () =>
      supabase.rpc("create_student_v1", {
        p_name: name || null,
        p_email: normalizedEmail || null,
        p_password_hash: passwordHash || null,
        p_whatsapp: payload.whatsapp || null,
        p_grade: payload.grade || null,
        p_program: payload.program || null,
        p_city: payload.city || null,
        p_is_active: true
      }),
    { context: "syncLeadToStudent:rpc" }
  );

  if (rpcError) {
    logger.error("RPC Error in syncLeadToStudent", { email: normalizedEmail, error: rpcError });
    throw rpcError;
  }

  if (data.status === "error") {
    // If user already exists, we might need to handle it differently, 
    // but the RPC already checks for existing users and students.
    logger.warn("Validation error in syncLeadToStudent RPC", { email: normalizedEmail, message: data.message });
    
    // If student already exists, we consider it a success for synchronization purposes
    if (data.message.includes("Siswa sudah terdaftar") || data.message.includes("Guru sudah terdaftar")) {
      return true;
    }
    
    throw new Error(data.message);
  }

  logger.info(`Successfully synchronized lead ${leadId} to student: ${data.data.id}`);
  return true;
};

/**
 * Create a new Student Lead
 */
export const createStudentLead = async (req, res, next) => {
  try {
    const payload = req.body;
    logger.info("Creating student lead", { payload });
    
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        type: "student",
        payload: payload,
        source: payload.source || "landing-page"
      })
      .select()
      .single();

    if (error) {
      logger.error("Create student lead database error", { error, payload });
      return next(error); // Let globalErrorHandler handle it
    }

    logger.info("Student lead created successfully", { leadId: lead.id });

    // Automatic lead to student synchronization with retry
    const MAX_RETRIES = 3;
    let syncSuccess = false;
    
    // We run this after response or in background if needed, but for now we wait to ensure consistency
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        await syncLeadToStudent(lead.id);
        syncSuccess = true;
        logger.info(`Successfully synchronized lead ${lead.id} to student (attempt ${i+1})`);
        break;
      } catch (syncError) {
        logger.error(`Synchronization attempt ${i+1} failed for lead ${lead.id}`, { syncError });
        if (i === MAX_RETRIES - 1) {
          logger.error(`All ${MAX_RETRIES} synchronization attempts failed for lead ${lead.id}`);
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    res.status(201).json({
      status: "success",
      message: "Permintaan Anda telah kami terima. Tim kami akan segera menghubungi Anda via WhatsApp.",
      data: { lead, syncSuccess }
    });
  } catch (error) {
    logger.error("Create student lead unexpected error", { error });
    next(error);
  }
};

/**
 * Create a new Tutor Lead
 */
export const createTutorLead = async (req, res, next) => {
  try {
    const payload = req.body;
    logger.info("Creating tutor lead", { payload });

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        type: "tutor",
        payload: payload,
        source: payload.source || "landing-page"
      })
      .select()
      .single();

    if (error) {
      logger.error("Create tutor lead database error", { error, payload });
      return next(error);
    }

    logger.info("Tutor lead created successfully", { leadId: lead.id });
    res.status(201).json({
      status: "success",
      message: "Pendaftaran Anda telah kami terima. Tim kami akan segera menghubungi Anda untuk proses seleksi.",
      data: { lead }
    });
  } catch (error) {
    logger.error("Create tutor lead unexpected error", { error });
    next(error);
  }
};
