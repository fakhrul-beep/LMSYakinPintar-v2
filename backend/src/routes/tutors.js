import express from "express";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { subject, city, ratingMin } = req.query;
    logger.info("Fetching tutors list", { query: req.query });
    
    let query = supabase
      .from("tutors")
      .select("*, users(id, name)")
      .eq("is_active", true);

    if (subject) {
      query = query.contains("subjects", [subject]);
    }
    if (city) {
      query = query.eq("city", city);
    }
    if (ratingMin) {
      query = query.gte("rating_average", Number(ratingMin) || 0);
    }

    query = query
      .order("rating_average", { ascending: false })
      .order("rating_count", { ascending: false })
      .limit(50);

    const { data: tutors, error } = await query;

    if (error) {
      logger.error("Supabase list tutors error", { error, query: req.query });
      return next(error);
    }

    const formattedTutors = tutors.map(t => ({
      ...t,
      availability: t.schedule, // Map schedule to availability for frontend compatibility
      user: t.users,
      users: undefined
    }));

    logger.info(`Fetched ${formattedTutors.length} tutors`);
    return res.json(formattedTutors);
  } catch (err) {
    logger.error("List tutors unexpected error", { err });
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    logger.info(`Fetching tutor detail: ${req.params.id}`);
    const { data: tutor, error } = await supabase
      .from("tutors")
      .select("*, users(id, name)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return next(new AppError("Tutor not found", 404));
      }
      logger.error("Get tutor error", { error, id: req.params.id });
      return next(error);
    }

    const formattedTutor = {
      ...tutor,
      availability: tutor.schedule, // Map schedule to availability for frontend compatibility
      user: tutor.users,
      users: undefined
    };

    return res.json(formattedTutor);
  } catch (err) {
    logger.error("Get tutor unexpected error", { err });
    next(err);
  }
});

export default router;
