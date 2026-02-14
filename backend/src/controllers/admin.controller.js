import supabase from "../config/supabase.js";
import { catchAsync } from "../utils/catchAsync.js";
import sanitizeHtml from "sanitize-html";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { withRetry } from "../utils/supabaseRetry.js";
import logger from "../utils/logger.js";

// Simple In-Memory Cache
const cache = {
  stats: null,
  lastFetched: 0,
  TTL: 5 * 60 * 1000, // 5 minutes
};

export const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password harus diisi" });
  }

  const { data: admin, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("role", "admin")
    .single();

  if (error || !admin) {
    return res.status(401).json({ message: "Kredensial tidak valid" });
  }

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: "Kredensial tidak valid" });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
  const token = jwt.sign(
    { id: admin.id, role: admin.role, name: admin.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    status: "success",
    token,
    user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

export const getDashboardStats = catchAsync(async (req, res) => {
  const now = Date.now();
  if (cache.stats && (now - cache.lastFetched < cache.TTL)) {
    return res.json({ status: "success", data: cache.stats, source: "cache" });
  }

  const [
    { count: programCount },
    { count: tutorCount },
    { count: blogCount }
  ] = await Promise.all([
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("tutors").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const stats = {
    programCount: programCount || 0,
    tutorCount: tutorCount || 0,
    blogCount: blogCount || 0,
    visitorStats: {
      today: 124, // Mock data
      thisWeek: 856, // Mock data
    }
  };

  cache.stats = stats;
  cache.lastFetched = now;

  res.json({
    status: "success",
    data: stats,
    source: "db"
  });
});

export const getPrograms = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("programs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (req.query.search) {
    query = query.ilike("name", `%${req.query.search}%`);
  }
  if (req.query.status) {
    query = query.eq("is_active", req.query.status === "active");
  }

  const { data: programs, count: total, error } = await query;

  if (error) throw error;

  const formattedPrograms = programs.map(p => ({
    ...p,
    createdAt: p.created_at,
    isActive: p.is_active,
    coverImage: p.cover_image,
    fullDescription: p.full_description,
    created_at: undefined,
    is_active: undefined,
    cover_image: undefined,
    full_description: undefined
  }));

  res.json({
    status: "success",
    data: {
      programs: formattedPrograms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const createProgram = catchAsync(async (req, res) => {
  if (req.body.fullDescription) {
    req.body.fullDescription = sanitizeHtml(req.body.fullDescription, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['style', 'class'],
      }
    });
  }

  // Check for duplicate name
  const { data: existing, error: checkError } = await supabase
    .from("programs")
    .select("id")
    .eq("name", req.body.name)
    .maybeSingle();
  
  if (existing) {
    return res.status(400).json({ status: "error", message: "Nama program sudah ada" });
  }

  const programData = {
    name: req.body.name,
    slug: req.body.slug,
    description: req.body.description,
    full_description: req.body.fullDescription,
    cover_image: req.body.coverImage,
    duration: req.body.duration,
    schedule: req.body.schedule,
    price: req.body.price,
    quota: req.body.quota,
    category: req.body.category,
    is_active: req.body.isActive !== undefined ? req.body.isActive : true
  };

  const { data: program, error } = await supabase
    .from("programs")
    .insert(programData)
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({ status: "success", data: program });
});

export const updateProgram = catchAsync(async (req, res) => {
  const updateData = { ...req.body };
  
  // Check for duplicate name if name is being updated
  if (updateData.name) {
    const { data: existing, error: checkError } = await supabase
      .from("programs")
      .select("id")
      .eq("name", updateData.name)
      .neq("id", req.params.id)
      .maybeSingle();
    
    if (existing) {
      return res.status(400).json({ status: "error", message: "Nama program sudah ada" });
    }
  }

  if (updateData.fullDescription) {
    updateData.full_description = sanitizeHtml(updateData.fullDescription, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['style', 'class'],
      }
    });
    delete updateData.fullDescription;
  }
  
  // Map camelCase to snake_case
  if (updateData.coverImage) {
    updateData.cover_image = updateData.coverImage;
    delete updateData.coverImage;
  }
  if (updateData.isActive !== undefined) {
    updateData.is_active = updateData.isActive;
    delete updateData.isActive;
  }

  const { data: program, error } = await supabase
    .from("programs")
    .update(updateData)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error || !program) {
      if (error?.code === 'PGRST116') return res.status(404).json({ message: "Program not found" });
      throw error;
  }
  
  res.json({ status: "success", data: program });
});

export const deleteProgram = catchAsync(async (req, res) => {
  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("id", req.params.id);

  if (error) throw error;
  res.status(204).json({ status: "success", data: null });
});

// Student Management
export const getStudents = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("students")
      .select("*, users!students_user_id_fkey(name, email, whatsapp)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (req.query.search) {
      query = query.or(`grade.ilike.%${req.query.search}%,program.ilike.%${req.query.search}%`);
    }

    const { data: students, count: total, error } = await query;
    
    if (error) {
      logger.error("Database error in getStudents", { error, query: req.query });
      // If table missing or other DB error, throw it so catchAsync handles it, 
      // but with a better message if possible
      throw error;
    }

    const formattedStudents = (students || []).map(s => ({
      ...s,
      createdAt: s.created_at,
      user: s.users,
      users: undefined,
      created_at: undefined
    }));

    res.json({
      status: "success",
      data: {
        students: formattedStudents,
        pagination: { 
          page, 
          limit, 
          total: total || 0, 
          pages: Math.ceil((total || 0) / limit) 
        },
      },
    });
  } catch (err) {
    logger.error("Unexpected error in getStudents", { error: err.message, stack: err.stack });
    
    // Check if it's a "table not found" error
    if (err.code === 'PGRST116' || err.message?.includes('relation "public.students" does not exist')) {
      return res.json({
        status: "success",
        data: {
          students: [],
          pagination: { page, limit, total: 0, pages: 0 },
        },
      });
    }
    
    res.status(500).json({ 
      status: "error", 
      message: "Gagal mengambil data siswa. Silakan coba lagi nanti.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export const createStudent = catchAsync(async (req, res) => {
  const { name, email, phone, grade, program, city, isActive } = req.body;

  const normalizedEmail = email.toLowerCase().trim();
  
  // Generate a random password for new students
  const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

  logger.info(`Attempting to create student: ${normalizedEmail}`);

  // Use RPC for atomic creation
  const { data, error: rpcError } = await withRetry(
    () =>
      supabase.rpc("create_student_v1", {
        p_name: name || null,
        p_email: normalizedEmail || null,
        p_password_hash: passwordHash || null,
        p_whatsapp: phone || null,
        p_grade: grade || null,
        p_program: program || null,
        p_city: city || null,
        p_is_active: isActive !== undefined ? isActive : true
      }),
    { context: "createStudent:rpc" }
  );

  if (rpcError) {
    logger.error("RPC Error in createStudent", { email: normalizedEmail, error: rpcError });
    throw rpcError;
  }

  if (data.status === "error") {
    logger.warn("Validation error in createStudent RPC", { email: normalizedEmail, message: data.message });
    return res.status(400).json({ message: data.message });
  }

  logger.info(`Successfully created student: ${normalizedEmail}`, { studentId: data.data.id });

  res.status(201).json({ 
    status: "success", 
    data: {
      id: data.data.id,
      user_id: data.data.user_id
    }
  });
});

export const updateStudent = catchAsync(async (req, res) => {
  const { name, email, phone, grade, program, city, isActive } = req.body;

  const { data: student, error: fetchError } = await withRetry(
    () =>
      supabase
        .from("students")
        .select("*, users!students_user_id_fkey(*)")
        .eq("id", req.params.id)
        .single(),
    { context: "updateStudent:fetchStudent" }
  );

  if (fetchError || !student) return res.status(404).json({ message: "Siswa tidak ditemukan" });

  // Update User fields
  if (name || email || phone) {
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone) userUpdates.whatsapp = phone;
    const { error: userUpdateError } = await withRetry(
      () => supabase.from("users").update(userUpdates).eq("id", student.user_id),
      { context: "updateStudent:updateUser" }
    );
    if (userUpdateError) throw userUpdateError;
  }

  // Update Student fields
  const studentUpdates = {};
  if (name) studentUpdates.name = name;
  if (grade) studentUpdates.grade = grade;
  if (program) studentUpdates.program = program;
  if (city) studentUpdates.city = city;
  if (isActive !== undefined) studentUpdates.is_active = isActive;

  const { data: updatedStudent, error: updateError } = await withRetry(
    () =>
      supabase
        .from("students")
        .update(studentUpdates)
        .eq("id", req.params.id)
        .select()
        .single(),
    { context: "updateStudent:updateStudent" }
  );

  if (updateError) throw updateError;

  res.json({ status: "success", data: updatedStudent });
});

export const deleteStudent = catchAsync(async (req, res) => {
  const { error } = await supabase.from("students").delete().eq("id", req.params.id);
  if (error) throw error;
  res.status(204).json({ status: "success", data: null });
});

// Payment Management
export const getPayments = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("payments")
      .select("*, users(name, email), bookings(id, status, programs(name))", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    const { data: payments, count: total, error } = await query;
    if (error) throw error;

    const formattedPayments = payments.map(p => ({
      ...p,
      user: p.users,
      booking: p.bookings,
      users: undefined,
      bookings: undefined
    }));

    res.json({
      status: "success",
      data: {
        payments: formattedPayments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    // If table missing or relationship error, return empty instead of 500
    res.json({
      status: "success",
      data: {
        payments: [],
        pagination: { page, limit, total: 0, pages: 0 },
      },
    });
  }
});

export const updatePaymentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { data: payment, error } = await supabase
    .from("payments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error || !payment) return res.status(404).json({ message: "Pembayaran tidak ditemukan" });

  // If payment approved, update booking status too? 
  if (status === 'completed' && payment.booking_id) {
    await supabase.from("bookings").update({ status: 'confirmed' }).eq("id", payment.booking_id);
  }

  res.json({ status: "success", data: payment });
});

// Testimonial Management
export const getTestimonials = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("testimonials")
      .select("*, users(name, role)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,content.ilike.%${req.query.search}%`);
    }

    const { data: testimonials, count: total, error } = await query;
    if (error) throw error;

    const formattedTestimonials = testimonials.map(t => ({
      ...t,
      name: t.name || t.users?.name,
      role: t.role || t.users?.role,
      user: t.users,
      users: undefined
    }));

    res.json({
      status: "success",
      data: {
        testimonials: formattedTestimonials,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    // If table missing, return empty instead of 500
    res.json({
      status: "success",
      data: {
        testimonials: [],
        pagination: { page, limit, total: 0, pages: 0 },
      },
    });
  }
});

export const updateTestimonialStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { data: testimonial, error } = await supabase
    .from("testimonials")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error || !testimonial) return res.status(404).json({ message: "Testimoni tidak ditemukan" });

  res.json({ status: "success", data: testimonial });
});

export const deleteTestimonial = catchAsync(async (req, res) => {
  const { error } = await supabase.from("testimonials").delete().eq("id", req.params.id);
  if (error) throw error;
  res.status(204).json({ status: "success", data: null });
});

// Tutor Management
export const getTutors = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Join with users
  let query = supabase
    .from("tutors")
    .select("*, users(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: tutors, count: total, error } = await query;

  if (error) throw error;

  // Flatten structure and map snake_case to camelCase
  const formattedTutors = tutors.map(t => ({
      ...t,
      specialization: t.subjects && t.subjects.length > 0 ? t.subjects[0] : "",
      education: t.education || t.bio || "",
      experience: t.experience || "",
      phone: t.users?.whatsapp,
      isActive: t.is_active,
      profilePhoto: t.profile_photo,
      hourlyRate: t.hourly_rate,
      city: t.city,
      area: t.area,
      createdAt: t.created_at,
      user: t.users,
      // Keep original snake_case fields for now to avoid breaking anything
      // but also provide camelCase for consistency
  }));

  res.json({
    status: "success",
    data: {
      tutors: formattedTutors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const updateTutorStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  const { data: tutor, error } = await supabase
    .from("tutors")
    .update({ is_active: isActive })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error || !tutor) return res.status(404).json({ message: "Tutor not found" });
  res.json({ status: "success", data: tutor });
});

export const createTutor = catchAsync(async (req, res) => {
  const { 
    name, email, phone, specialization, education, experience,
    profilePhoto, isActive, hourlyRate, city, area 
  } = req.body;

  // Phone validation (Indonesian format)
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  if (phone && !phoneRegex.test(phone.replace(/\s/g, ""))) {
    return res.status(400).json({ message: "Format nomor telepon tidak valid" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Generate a random password for new tutors (they can reset it later)
  const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

  logger.info(`Attempting to create tutor: ${normalizedEmail}`);

  // Use RPC for atomic creation of both user and tutor records
  const { data, error: rpcError } = await withRetry(
    () =>
      supabase.rpc("create_tutor_v1", {
        p_name: name || null,
        p_email: normalizedEmail || null,
        p_password_hash: passwordHash || null,
        p_whatsapp: phone || null,
        p_bio: education || null, // Keep bio for RPC if it expects it
        p_subjects: specialization ? [specialization] : [],
        p_profile_photo: profilePhoto || null,
        p_is_active: isActive !== undefined ? isActive : true
      }),
    { context: "createTutor:rpc" }
  );

  if (rpcError) {
    logger.error("RPC Error in createTutor", { email: normalizedEmail, error: rpcError });
    throw rpcError;
  }

  if (data.status === "error") {
    logger.warn("Validation error in createTutor RPC", { email: normalizedEmail, message: data.message });
    return res.status(400).json({ message: data.message });
  }

  // RPC usually only creates the basic record. We might need to update additional fields 
  // that the RPC doesn't handle (experience, hourlyRate, city, area, education).
  const tutorId = data.data.id;
  const tutorUpdates = {};
  if (education) tutorUpdates.education = education;
  if (experience) tutorUpdates.experience = experience;
  if (hourlyRate) tutorUpdates.hourly_rate = hourlyRate;
  if (city) tutorUpdates.city = city;
  if (area) tutorUpdates.area = area;

  if (Object.keys(tutorUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from("tutors")
      .update(tutorUpdates)
      .eq("id", tutorId);
    
    if (updateError) {
      logger.error("Failed to update extra fields for new tutor", { tutorId, error: updateError });
      // We don't throw here to avoid failing the whole creation if just the extra fields fail,
      // but in a real app you might want to.
    }
  }

  logger.info(`Successfully created tutor: ${normalizedEmail}`, { tutorId });

  res.status(201).json({ 
    status: "success", 
    data: {
      id: tutorId,
      user_id: data.data.user_id
    }
  });
});

export const updateTutor = catchAsync(async (req, res) => {
  const { 
    name, phone, specialization, education, experience, 
    profilePhoto, isActive, hourlyRate, city, area 
  } = req.body;

  const { data: tutor, error: fetchError } = await supabase.from("tutors").select("*, users(*)").eq("id", req.params.id).single();
  if (fetchError || !tutor) return res.status(404).json({ message: "Tutor not found" });

  // Update User name/phone
  if (name || phone) {
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (phone) userUpdates.whatsapp = phone;
    await supabase.from("users").update(userUpdates).eq("id", tutor.user_id);
  }

  // Update Tutor fields
  const tutorUpdates = {};
  if (specialization) tutorUpdates.subjects = [specialization];
  if (education !== undefined) {
    tutorUpdates.education = education;
    // Also update bio for backward compatibility if it was used as education
    tutorUpdates.bio = education;
  }
  if (experience !== undefined) tutorUpdates.experience = experience;
  if (profilePhoto !== undefined) tutorUpdates.profile_photo = profilePhoto;
  if (isActive !== undefined) tutorUpdates.is_active = isActive;
  if (hourlyRate !== undefined) tutorUpdates.hourly_rate = hourlyRate;
  if (city !== undefined) tutorUpdates.city = city;
  if (area !== undefined) tutorUpdates.area = area;

  const { data: updatedTutor, error: updateError } = await supabase
    .from("tutors")
    .update(tutorUpdates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (updateError) throw updateError;
  
  res.json({ status: "success", data: updatedTutor });
});

// Blog Management
export const getBlogPosts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("blog_posts")
    .select("*, users(name)", { count: "exact" }) // author -> users
    .order("created_at", { ascending: false })
    .range(from, to);

  if (req.query.search) {
    query = query.ilike("title", `%${req.query.search}%`);
  }

  const { data: posts, count: total, error } = await query;
  if (error) throw error;

  const formattedPosts = posts.map(p => ({
      ...p,
      featuredImage: p.featured_image,
      createdAt: p.created_at,
      author: p.users,
      users: undefined,
      featured_image: undefined,
      created_at: undefined
  }));

  res.json({
    status: "success",
    data: {
      posts: formattedPosts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const createBlogPost = catchAsync(async (req, res) => {
  const { title, content, excerpt, category, tags, featuredImage, status, publishedAt } = req.body;
  
  const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

  const postData = {
    title,
    slug,
    content: content ? sanitizeHtml(content) : content,
    excerpt,
    category,
    tags,
    featured_image: featuredImage,
    status: status || "draft",
    published_at: status === "scheduled" ? publishedAt : (status === "published" ? new Date().toISOString() : null),
    author_id: req.user.id,
  };

  const { data: post, error } = await supabase.from("blog_posts").insert(postData).select().single();
  if (error) throw error;

  res.status(201).json({ status: "success", data: post });
});

export const updateBlogPost = catchAsync(async (req, res) => {
  const { title, content, excerpt, category, tags, featuredImage, status, publishedAt } = req.body;
  
  const updates = {};
  if (title) {
      updates.title = title;
      updates.slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  }
  if (content) updates.content = sanitizeHtml(content);
  if (excerpt) updates.excerpt = excerpt;
  if (category) updates.category = category;
  if (tags) updates.tags = tags;
  if (featuredImage) updates.featured_image = featuredImage;
  
  if (status) {
    updates.status = status;
    if (status === "scheduled") {
      updates.published_at = publishedAt;
    } else if (status === "published") {
      // Check if already published to avoid overwriting date? Or just update it.
      updates.published_at = new Date().toISOString();
    } else if (status === "draft") {
      updates.published_at = null;
    }
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) throw error;
  res.json({ status: "success", data: post });
});

export const deleteBlogPost = catchAsync(async (req, res) => {
  const { error } = await supabase.from("blog_posts").delete().eq("id", req.params.id);
  if (error) throw error;
  res.status(204).json({ status: "success", data: null });
});

// Blog Category Management
export const getBlogCategories = catchAsync(async (req, res) => {
  const { data: categories, error } = await supabase
    .from("blog_posts") // Fallback to distinct categories from blog_posts
    .select("category")
    .not("category", "is", null);

  if (error) {
    // If table doesn't exist or other error, return empty array instead of 500
    return res.json({ status: "success", data: [] });
  }

  // Get unique categories
  const uniqueCategories = [...new Set(categories.map(c => c.category))].map(name => ({
    id: name,
    name: name,
    slug: name.toLowerCase().replace(/ /g, "-")
  }));

  res.json({ status: "success", data: uniqueCategories });
});

export const createBlogCategory = catchAsync(async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

  const { data: category, error } = await supabase
    .from("blog_categories")
    .insert({ name, slug })
    .select()
    .single();

  if (error) throw error;
  res.status(201).json({ status: "success", data: category });
});

export const updateBlogCategory = catchAsync(async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

  const { data: category, error } = await supabase
    .from("blog_categories")
    .update({ name, slug })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) throw error;
  res.json({ status: "success", data: category });
});

export const deleteBlogCategory = catchAsync(async (req, res) => {
  const { error } = await supabase
    .from("blog_categories")
    .delete()
    .eq("id", req.params.id);

  if (error) throw error;
  res.status(204).json({ status: "success", data: null });
});

// Activity Logs
export const getActivityLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: logs, count: total, error } = await supabase
    .from("activity_logs")
    .select("*, users(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const formattedLogs = logs.map(l => ({
      ...l,
      user: l.users,
      users: undefined
  }));

  res.json({
    status: "success",
    data: {
      logs: formattedLogs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

// Admin User Management
export const getAdmins = catchAsync(async (req, res) => {
  const { data: admins, error } = await supabase
    .from("users")
    .select("id, name, email, role, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) throw error;
  res.json({ status: "success", data: admins });
});

export const createAdmin = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  
  const { data: existing } = await supabase.from("users").select("id").eq("email", email).single();
  if (existing) {
    return res.status(409).json({ message: "Email sudah terdaftar" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: admin, error } = await supabase.from("users").insert({
    name,
    email,
    password_hash: passwordHash,
    role: "admin",
  }).select().single();

  if (error) throw error;

  res.status(201).json({ 
    status: "success", 
    data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } 
  });
});

export const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Tidak ada file yang diunggah" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({
    status: "success",
    data: {
      url: fileUrl,
      filename: req.file.filename,
    },
  });
});

export const updateAdmin = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  const { data: admin, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.params.id)
    .eq("role", "admin") // Ensure target is admin
    .select()
    .single();

  if (error || !admin) return res.status(404).json({ message: "Admin tidak ditemukan" });

  res.json({ 
    status: "success", 
    data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } 
  });
});

export const deleteAdmin = catchAsync(async (req, res) => {
  // Prevent self-deletion if needed (logic omitted for brevity)
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", req.params.id)
    .eq("role", "admin");

  if (error) throw error;
  res.status(204).json({ status: "success", data: null });
});
