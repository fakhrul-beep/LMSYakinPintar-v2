import express from "express";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * @route   GET /api/programs
 * @desc    Get all active programs
 * @access  Public
 */
router.get("/", async (req, res, next) => {
  try {
    const { category, search } = req.query;
    
    let query = supabase
      .from("programs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (category && category !== "Semua") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: programs, error } = await query;

    if (error) {
      logger.error("Supabase fetch programs error", { error });
      return res.status(500).json({ status: "error", message: "Gagal memuat program" });
    }

    const formattedPrograms = programs.map(p => ({
      ...p,
      createdAt: p.created_at,
      isActive: p.is_active,
      coverImage: p.cover_image,
      fullDescription: p.full_description,
      // Remove snake_case fields for cleaner response
      created_at: undefined,
      is_active: undefined,
      cover_image: undefined,
      full_description: undefined
    }));

    return res.json({
      status: "success",
      data: {
        programs: formattedPrograms
      }
    });
  } catch (err) {
    logger.error("Public programs unexpected error", { err });
    next(err);
  }
});

/**
 * @route   GET /api/programs/:slug
 * @desc    Get program details by slug
 * @access  Public
 */
router.get("/:slug", async (req, res, next) => {
  try {
    const { data: program, error } = await supabase
      .from("programs")
      .select("*")
      .eq("slug", req.params.slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ status: "error", message: "Program tidak ditemukan" });
      }
      throw error;
    }

    const formattedProgram = {
      ...program,
      createdAt: program.created_at,
      isActive: program.is_active,
      coverImage: program.cover_image,
      fullDescription: program.full_description,
      created_at: undefined,
      is_active: undefined,
      cover_image: undefined,
      full_description: undefined
    };

    return res.json({
      status: "success",
      data: formattedProgram
    });
  } catch (err) {
    logger.error("Public program detail unexpected error", { err });
    next(err);
  }
});

export default router;
