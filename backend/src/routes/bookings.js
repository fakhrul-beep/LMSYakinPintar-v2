import express from "express";
import supabase from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Creates a new booking.
 * 
 * Flow:
 * 1. Validates required fields.
 * 2. Checks if the tutor exists.
 * 3. Creates a new student record (linked to the parent).
 * 4. Creates a new booking record.
 * 
 * @route POST /api/bookings
 * @access Private
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { 
      studentName, 
      grade, 
      subject, 
      mode, 
      city, 
      area, 
      scheduledAt, 
      durationHours, 
      priceTotal, 
      tutorId 
    } = req.body || {};

    // 1. Validation
    if (!studentName || !grade || !subject || !scheduledAt || !priceTotal || !tutorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 2. Check Tutor existence
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("id", tutorId)
      .single();

    if (tutorError || !tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // 3. Create Student
    // In this MVP flow, a new student is created for every booking if passed in body.
    // Ideally, we might want to select existing students, but we keep logic consistent with original code.
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        parent_id: req.user.id,
        name: studentName,
        grade,
        city: city || "",
        area: area || ""
      })
      .select()
      .single();

    if (studentError) {
      console.error("Create student error", studentError);
      return res.status(500).json({ message: "Error creating student profile" });
    }

    // 4. Create Booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        student_id: student.id,
        parent_id: req.user.id,
        tutor_id: tutorId,
        subject,
        mode: mode || "offline",
        city: city || "",
        area: area || "",
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_hours: durationHours || 2,
        price_total: priceTotal,
        status: "requested"
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Create booking error", bookingError);
      return res.status(500).json({ message: "Error creating booking" });
    }

    return res.status(201).json(booking);
  } catch (err) {
    console.error("Create booking error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Retrieves bookings for the authenticated parent.
 * 
 * @route GET /api/bookings/mine
 * @access Private
 */
router.get("/mine", requireAuth, async (req, res) => {
  try {
    // Supabase join syntax:
    // select(*, tutors(*), students(*))
    // We can be specific about fields: tutors(id, subjects, city, area), students(name, grade)
    
    // Note: To get tutor's user name (which is in users table, linked via tutors.user_id),
    // we need nested join: tutors(..., users(name))
    
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        tutors (
          id,
          city,
          area,
          subjects,
          users ( name )
        ),
        students (
          name,
          grade
        )
      `)
      .eq("parent_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List my bookings error", error);
      return res.status(500).json({ message: "Error fetching bookings" });
    }

    // Transform response to match frontend expectations (flattening nested structures)
    const formattedBookings = bookings.map(b => ({
      ...b,
      tutor: {
        ...b.tutors,
        // user name is inside b.tutors.users.name
        user: b.tutors?.users, 
        users: undefined 
      },
      tutors: undefined, // cleanup
      student: b.students,
      students: undefined // cleanup
    }));

    return res.json(formattedBookings);
  } catch (err) {
    console.error("List my bookings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Updates the status of a booking.
 * 
 * @route PATCH /api/bookings/:id/status
 * @access Private
 */
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["requested", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update and return the updated record
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      console.error("Update booking status error", error);
      return res.status(500).json({ message: "Error updating booking status" });
    }

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Optional: If we had a socket.io or similar, we'd emit here.
    // Since we're using BroadcastChannel in frontend, we'll let the tutor dashboard
    // or student dashboard handle their own refreshes or use a shared BroadcastChannel if on same machine.
    
    return res.json(booking);
  } catch (err) {
    console.error("Update booking status error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Retrieves bookings for the authenticated tutor that are ready for reporting.
 * (Status 'completed' or date has passed, and no report exists yet)
 * 
 * @route GET /api/bookings/tutor/completed-for-report
 * @access Private
 */
router.get("/tutor/completed-for-report", requireAuth, async (req, res) => {
  try {
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (tutorError || !tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Get bookings that are 'completed' or past date
    const now = new Date().toISOString();
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        students (name, grade),
        reports (id)
      `)
      .eq("tutor_id", tutor.id)
      .or(`status.eq.completed,scheduled_at.lt.${now}`)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("List completed bookings error", error);
      return res.status(500).json({ message: "Error fetching bookings" });
    }

    // Filter out those that already have reports
    const pendingReports = bookings.filter(b => !b.reports || b.reports.length === 0);

    return res.json(pendingReports.map(b => ({
      ...b,
      student: b.students,
      reports: undefined,
      students: undefined
    })));
  } catch (err) {
    console.error("List completed bookings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Retrieves bookings for the authenticated tutor.
 * 
 * @route GET /api/bookings/tutor
 * @access Private
 */
router.get("/tutor", requireAuth, async (req, res) => {
  try {
    // First, find the tutor record linked to the authenticated user
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (tutorError || !tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        students (
          name,
          grade,
          city,
          area
        ),
        parents:parent_id (
          name,
          whatsapp
        )
      `)
      .eq("tutor_id", tutor.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List tutor bookings error", error);
      return res.status(500).json({ message: "Error fetching bookings" });
    }

    // Transform response to match frontend expectations
    const formattedBookings = bookings.map(b => ({
      ...b,
      student: b.students,
      parent: b.parents,
      students: undefined,
      parents: undefined
    }));

    return res.json(formattedBookings);
  } catch (err) {
    console.error("List tutor bookings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
