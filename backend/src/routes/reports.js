import express from "express";
import supabase from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Creates a new report for a booking.
 * Access: Tutor only.
 * 
 * @route POST /api/reports
 */
router.post("/", requireAuth, requireRole("tutor"), async (req, res) => {
  try {
    const { bookingId, summary, score, nextPlan, homework, notes } = req.body;

    if (!bookingId || !summary) {
      return res.status(400).json({ message: "Field wajib (bookingId, ringkasan) harus diisi" });
    }

    // Validate score (0-100)
    if (score !== undefined && score !== null) {
      const numScore = Number(score);
      if (isNaN(numScore) || numScore < 0 || numScore > 100) {
        return res.status(400).json({ message: "Skor harus berupa angka antara 0-100" });
      }
    }

    // 1. Get Booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, tutors(user_id)") // Get booking and related tutor's user_id
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ message: "Data pertemuan tidak ditemukan" });
    }

    // 2. Authorization: Ensure the logged-in user is the tutor for this booking
    if (booking.tutors?.user_id !== req.user.id) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk membuat laporan ini" });
    }

    // 3. Create Report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        booking_id: bookingId,
        tutor_id: booking.tutor_id,
        summary,
        score: score || null,
        next_plan: nextPlan || "",
        homework: homework || "",
        notes: notes || ""
      })
      .select()
      .single();

    if (reportError) {
      console.error("Create report error:", reportError);
      
      // Handle specific DB errors if needed
      if (reportError.code === '23505') { // unique violation
        return res.status(400).json({ message: "Laporan untuk pertemuan ini sudah pernah dibuat" });
      }
      
      return res.status(500).json({ 
        message: "Gagal menyimpan laporan ke database",
        error: process.env.NODE_ENV === 'development' ? reportError : undefined
      });
    }

    // 4. Update Booking status to 'completed' after report is created
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: 'completed' })
      .eq("id", bookingId);

    if (updateError) {
      console.warn("Failed to update booking status:", updateError);
      // We don't return error here because report is already created
    }

    return res.status(201).json({
      status: "success",
      message: "Laporan belajar berhasil dibuat",
      data: report
    });
  } catch (err) {
    console.error("Create report error:", err);
    return res.status(500).json({ message: "Terjadi kesalahan internal pada server" });
  }
});

/**
 * Get all reports for the authenticated student.
 * Access: Student only.
 * 
 * @route GET /api/reports/student
 */
router.get("/student", requireAuth, requireRole("student"), async (req, res) => {
  try {
    // We need reports linked to bookings where the student belongs to the logged-in parent (or student user).
    // Assuming req.user.id is the Parent ID (based on auth flow where parent registers).
    // If student has their own login, we'd check student_id directly.
    // Based on previous code: `student: req.user._id` was used in filtering? 
    // Wait, original code had `match: { student: req.user._id }`.
    // Let's assume req.user.id matches the parent_id in bookings (since Parents book for students).
    
    // Join reports -> bookings -> filter by parent_id
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        *,
        bookings!inner (
          id,
          student_id,
          parent_id,
          subject,
          scheduled_at,
          tutors (
            users (name)
          )
        )
      `)
      .eq("bookings.parent_id", req.user.id) // Filter inner joined bookings
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get student reports error", error);
      return res.status(500).json({ message: "Error fetching reports" });
    }

    return res.json(reports);
  } catch (err) {
    console.error("Get student reports error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Get all reports created by the authenticated tutor.
 * Access: Tutor only.
 * 
 * @route GET /api/reports/tutor
 */
router.get("/tutor", requireAuth, requireRole("tutor"), async (req, res) => {
  try {
    // 1. Get Tutor ID from User ID
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (tutorError || !tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // 2. Get Reports
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        *,
        bookings (
          id,
          subject,
          scheduled_at,
          students (name)
        )
      `)
      .eq("tutor_id", tutor.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get tutor reports error", error);
      return res.status(500).json({ message: "Error fetching reports" });
    }

    return res.json(reports);
  } catch (err) {
    console.error("Get tutor reports error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Get single report details.
 * Access: Private (TODO: Add granular access control)
 * 
 * @route GET /api/reports/:id
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { data: report, error } = await supabase
      .from("reports")
      .select(`
        *,
        bookings (
          *,
          students (name),
          tutors (
            users (name)
          )
        )
      `)
      .eq("id", req.params.id)
      .single();
      
    if (error || !report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json(report);
  } catch (err) {
    console.error("Get report error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
