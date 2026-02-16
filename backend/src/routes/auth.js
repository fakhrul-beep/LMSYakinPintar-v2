import express from "express";
import multer from "multer";
import path from "path";
import { registerStudent, registerTutor, login } from "../controllers/auth.controller.js";

const router = express.Router();

// Multer configuration for registration (public)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
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

router.post("/register/student", registerStudent);
router.post("/register/tutor", upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), registerTutor);
router.post("/login", login);

export default router;
