import bcrypt from "bcryptjs";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";
import { logActivity } from "../utils/activityLogger.js";

export const getProfile = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, role, whatsapp, created_at")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return next(new AppError("User not found", 404));
    }

    let extraData = null;
    if (role === "student") {
      const { data: student, error } = await supabase
        .from("students")
        .select("*, parent:parent_id(id, name, email)")
        .eq("user_id", id)
        .single();
      extraData = student;
    } else if (role === "parent") {
      // Get all students linked to this parent
      const { data: children, error } = await supabase
        .from("parent_students")
        .select("student:student_id(*)")
        .eq("parent_id", id);
      
      // Also check students where this user is directly set as parent_id
      const { data: directStudents, error: directError } = await supabase
        .from("students")
        .select("*")
        .eq("parent_id", id);

      extraData = {
        children: children?.map(c => c.student) || [],
        directStudents: directStudents || []
      };
    } else if (role === "tutor") {
      const { data: tutor, error } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", id)
        .single();
      
      if (tutor) {
        // Map schedule to availability for frontend compatibility
        tutor.availability = tutor.schedule;
      }
      extraData = tutor;
    }

    res.json({
      status: "success",
      data: {
        ...user,
        profile: extraData
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { name, whatsapp, profile_photo, profileData = {} } = req.body;

    // 1. Update User table
    const updateData = {};
    if (name) updateData.name = name;
    if (whatsapp) updateData.whatsapp = whatsapp;

    let user = null;
    if (Object.keys(updateData).length > 0) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (userError) throw userError;
      user = userData;
    } else {
      // Fetch current user if no updates to users table
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;
      user = userData;
    }

    // 2. Update Role-specific table
    let updatedProfile = null;
    if (role === "student") {
      const studentUpdate = {};
      if (profileData.grade !== undefined) studentUpdate.grade = profileData.grade;
      if (profileData.program !== undefined) studentUpdate.program = profileData.program;
      if (profileData.city !== undefined) studentUpdate.city = profileData.city;
      if (profile_photo !== undefined) studentUpdate.profile_photo = profile_photo;

      if (Object.keys(studentUpdate).length > 0) {
        const { data, error } = await supabase
          .from("students")
          .update(studentUpdate)
          .eq("user_id", id)
          .select()
          .single();
        
        if (error) throw error;
        updatedProfile = data;
      } else {
        // Fetch current student profile if no updates
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", id)
          .single();
        if (error) throw error;
        updatedProfile = data;
      }
    } else if (role === "tutor") {
      // 1. Validate Input Data
      if (profileData.hourly_rate && isNaN(Number(profileData.hourly_rate))) {
        return next(new AppError("Harga per jam harus berupa angka", 400));
      }

      // 2. Perform the Update
      const tutorUpdate = {};
      const schemaFields = [
        'education', 'experience', 'subjects', 'student_grades', 
        'hourly_rate', 'city', 'area', 'availability', 'schedule',
        'certifications', 'privacy_settings', 'profile_photo', 'bio'
      ];

      schemaFields.forEach(field => {
        if (profileData[field] !== undefined) tutorUpdate[field] = profileData[field];
      });
      
      // Map availability to schedule if schedule exists but availability doesn't
      // Ensure we use the JSON string for the database column 'schedule'
      if (profileData.availability !== undefined) {
        tutorUpdate.schedule = profileData.availability;
      }

      if (profile_photo !== undefined) tutorUpdate.profile_photo = profile_photo;

      if (Object.keys(tutorUpdate).length > 0) {
        // Fetch current tutor profile to validate columns and for backup
        const { data: currentTutor, error: fetchError } = await supabase
          .from("tutors")
          .select("*")
          .eq("user_id", id)
          .single();

        if (fetchError) {
          logger.error("Error fetching tutor for update:", fetchError);
          return next(new AppError("Gagal mengambil data profil tutor", 500));
        }

        // Backup before update
        if (currentTutor) {
          try {
            // Check if table exists first (optional but safer)
            await supabase.from("tutor_profile_versions").insert({
              tutor_id: currentTutor.id,
              snapshot: currentTutor,
              version_note: "Auto-save before update"
            });
          } catch (err) {
            logger.warn("Backup failed, continuing update:", err);
          }
          
          // CRITICAL FIX: Filter tutorUpdate to only include columns that actually exist in the table
          const existingColumns = Object.keys(currentTutor);
          Object.keys(tutorUpdate).forEach(key => {
            if (!existingColumns.includes(key)) {
              logger.warn(`Column '${key}' does not exist in 'tutors' table, skipping...`);
              delete tutorUpdate[key];
            }
          });
        }

        logger.info(`Updating tutor ${id} with:`, tutorUpdate);

        if (Object.keys(tutorUpdate).length > 0) {
          const { data: updatedData, error: updateError } = await supabase
            .from("tutors")
            .update(tutorUpdate)
            .eq("user_id", id)
            .select()
            .single();

          if (updateError) {
            logger.error("Error updating tutor table:", updateError);
            return next(new AppError(`Gagal memperbarui profil: ${updateError.message}`, 500));
          }
          
          // VERIFICATION: Check if data was actually saved
          const { data: verifyData, error: verifyError } = await supabase
            .from("tutors")
            .select("*")
            .eq("user_id", id)
            .single();
          
          if (verifyError || !verifyData) {
            logger.error("Save verification failed:", verifyError);
          } else {
            // Check specific fields that were supposed to be updated
            const mismatchedFields = Object.keys(tutorUpdate).filter(key => 
              JSON.stringify(tutorUpdate[key]) !== JSON.stringify(verifyData[key])
            );
            if (mismatchedFields.length > 0) {
              logger.error(`Field mismatch after save for tutor ${id}:`, mismatchedFields);
            } else {
              logger.info(`Save verification successful for tutor ${id}`);
            }
          }

          updatedProfile = updatedData;
          logger.info(`Successfully updated tutor ${id}`);
        } else {
          updatedProfile = currentTutor;
        }
      } else {
        // Fetch current tutor profile if no updates
        const { data, error } = await supabase
          .from("tutors")
          .select("*")
          .eq("user_id", id)
          .single();
        if (error) throw error;
        updatedProfile = data;
      }
      
      await logActivity(req, "UPDATE_PROFILE", "User updated their profile");
    }

    res.json({
      status: "success",
      data: {
        ...user,
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTutorVersions = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    if (role !== 'tutor') return next(new AppError("Only tutors can access this", 403));

    const { data: tutor } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", id)
      .single();

    if (!tutor) return next(new AppError("Tutor profile not found", 404));

    const { data: versions, error } = await supabase
      .from("tutor_profile_versions")
      .select("*")
      .eq("tutor_id", tutor.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        logger.warn(`tutor_profile_versions table not found, returning empty list`);
        return res.json({
          status: "success",
          data: []
        });
      }
      throw error;
    }

    res.json({
      status: "success",
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

export const rollbackTutorProfile = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { versionId } = req.body;

    if (role !== 'tutor') return next(new AppError("Only tutors can access this", 403));

    const { data: version, error: vError } = await supabase
      .from("tutor_profile_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (vError || !version) {
      if (vError?.message?.includes('does not exist')) {
        return next(new AppError("Fitur riwayat profil belum tersedia di database", 503));
      }
      return next(new AppError("Version not found", 404));
    }

    // Restore tutor data from snapshot
    const { snapshot } = version;
    const { id: tId, user_id, created_at, updated_at, ...restoreData } = snapshot;

    const { data: updatedTutor, error: uError } = await supabase
      .from("tutors")
      .update(restoreData)
      .eq("user_id", id)
      .select()
      .single();

    if (uError) throw uError;

    await logActivity(req, "ROLLBACK_PROFILE", `Tutor rolled back profile to version from ${version.created_at}`);

    res.json({
      status: "success",
      data: updatedTutor
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    // 1. Get user with password hash
    const { data: user, error } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", id)
      .single();

    if (error || !user) return next(new AppError("User not found", 404));

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return next(new AppError("Password saat ini salah", 400));

    // 3. Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", id);

    if (updateError) throw updateError;

    await logActivity(req, "CHANGE_PASSWORD", "User changed their password");

    res.json({
      status: "success",
      message: "Password berhasil diubah"
    });
  } catch (error) {
    next(error);
  }
};
