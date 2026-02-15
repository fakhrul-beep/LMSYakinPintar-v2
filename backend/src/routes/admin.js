import express from "express";
import multer from "multer";
import path from "node:path";
import * as adminController from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateRegister, logUserCreation } from "../middleware/security.middleware.js";

const router = express.Router();

// Multer configuration - Use Memory Storage for Cloudflare Workers
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Hanya file gambar (jpeg, jpg, png, webp) yang diperbolehkan!"));
  },
});

router.post("/login", adminController.adminLogin);

// Protected routes
router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/dashboard/stats", adminController.getDashboardStats);

// Upload route
router.post("/upload", upload.single("image"), adminController.uploadImage);

// Program management
router.get("/programs", adminController.getPrograms);
router.post("/programs", adminController.createProgram);
router.put("/programs/:id", adminController.updateProgram);
router.delete("/programs/:id", adminController.deleteProgram);

// Student management
router.get("/students", adminController.getStudents);
router.post("/students", adminController.createStudent);
router.put("/students/:id", adminController.updateStudent);
router.delete("/students/:id", adminController.deleteStudent);

// Tutor management
router.get("/tutors", adminController.getTutors);
router.post("/tutors", adminController.createTutor);
router.put("/tutors/:id", adminController.updateTutor);
router.patch("/tutors/:id/status", adminController.updateTutorStatus);

// Payment management
router.get("/payments", adminController.getPayments);
router.patch("/payments/:id/status", adminController.updatePaymentStatus);

// Blog management
router.get("/blog", adminController.getBlogPosts);
router.post("/blog", adminController.createBlogPost);
router.put("/blog/:id", adminController.updateBlogPost);
router.delete("/blog/:id", adminController.deleteBlogPost);

// Blog category management
router.get("/blog-categories", adminController.getBlogCategories);
router.post("/blog-categories", adminController.createBlogCategory);
router.put("/blog-categories/:id", adminController.updateBlogCategory);
router.delete("/blog-categories/:id", adminController.deleteBlogCategory);

// Testimonial management
router.get("/testimonials", adminController.getTestimonials);
router.patch("/testimonials/:id/status", adminController.updateTestimonialStatus);
router.delete("/testimonials/:id", adminController.deleteTestimonial);

// Activity logs
router.get("/logs", adminController.getActivityLogs);

// Admin management
router.get("/users", adminController.getAdmins);
router.post("/users", validateRegister, logUserCreation, adminController.createAdmin);
router.put("/users/:id", adminController.updateAdmin);
router.delete("/users/:id", adminController.deleteAdmin);

export default router;
