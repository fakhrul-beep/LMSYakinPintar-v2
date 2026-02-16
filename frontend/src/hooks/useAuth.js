import { useState } from "react";
import api from "../api/axios";

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Try admin login first if on admin page, or just try auth/login
      const res = await api.post("admin/login", { email, password });
      const { token, user: userData } = res.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.friendlyMessage || "Login gagal" 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/admin/login";
  };

  const isAdmin = user?.role === "admin";

  return { user, login, logout, isAdmin, loading };
};
