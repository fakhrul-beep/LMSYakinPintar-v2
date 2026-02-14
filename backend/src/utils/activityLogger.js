import supabase from "../config/supabase.js";

export const logActivity = async (req, action, description = "", details = {}) => {
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: req.user?.id,
        action,
        description,
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
        // details can be stored in description or we can add a details column to activity_logs if needed
        // For now, let's just use description and maybe append details if they exist
      });

    if (error) throw error;
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};
