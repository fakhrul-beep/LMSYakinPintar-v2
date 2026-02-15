import express from "express";
import multer from "multer";
import path from "node:path";
import { 
  getProfile, 
  updateProfile, 
  getTutorVersions, 
  rollbackTutorProfile,
  changePassword 
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import supabase from "../config/supabase.js";

const router = express.Router();

// Multer configuration for profile photos - Use Memory Storage for Cloudflare Workers
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit as requested
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Format JPG, PNG maksimal 2MB!"));
  },
});

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.get("/profile/versions", requireAuth, getTutorVersions);
router.post("/profile/rollback", requireAuth, rollbackTutorProfile);
router.post("/profile/password", requireAuth, changePassword);

// Profile photo upload
router.post("/profile/photo", requireAuth, upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file yang diunggah" });
    }

    const { id, role } = req.user;
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // Update the user's profile photo in the appropriate table
    if (role === 'student') {
      const { error } = await supabase
        .from("students")
        .update({ profile_photo: fileUrl })
        .eq("user_id", id);
      if (error) throw error;
    } else if (role === 'tutor') {
      const { error } = await supabase
        .from("tutors")
        .update({ profile_photo: fileUrl })
        .eq("user_id", id);
      if (error) throw error;
    }

    res.json({
      status: "success",
      data: {
        url: fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;