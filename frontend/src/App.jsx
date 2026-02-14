import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import NetworkMonitor from "./components/NetworkMonitor";
import LandingPage from "./pages/LandingPage";
import DaftarMuridPage from "./pages/DaftarMuridPage";
import DaftarGuruPage from "./pages/DaftarGuruPage";
import TutorListPage from "./pages/TutorListPage";
import BlogPage from "./pages/BlogPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import SubjectsPage from "./pages/SubjectsPage";
import TutorProfilePage from "./pages/tutor/TutorProfilePage";
import TutorEditProfilePage from "./pages/tutor/TutorEditProfilePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./components/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminProgramsPage from "./pages/AdminProgramsPage";
import AdminTutorsPage from "./pages/AdminTutorsPage";
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminBlogCategoriesPage from "./pages/AdminBlogCategoriesPage";
import AdminActivityLogPage from "./pages/AdminActivityLogPage";
import AdminRoleManagementPage from "./pages/AdminRoleManagementPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminTestimonialsPage from "./pages/AdminTestimonialsPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import TutorDashboardPage from "./pages/TutorDashboardPage";
import CreateReportPage from "./pages/tutor/CreateReportPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Toaster position="top-right" />
      <NetworkMonitor />
      <ScrollToTop />
      <Routes>
        {/* Public Routes with Navbar/Footer */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/daftar-murid" element={<DaftarMuridPage />} />
                <Route path="/daftar-guru" element={<DaftarGuruPage />} />
                <Route path="/tutors" element={<TutorListPage />} />
                <Route path="/tutors/:id" element={<TutorProfilePage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
              </Routes>
              <Footer />
            </>
          }
        />

        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentDashboardPage />} />
        </Route>

        {/* Tutor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
          <Route path="/tutor" element={<TutorDashboardPage />} />
          <Route path="/tutor/profile/edit" element={<TutorEditProfilePage />} />
          <Route path="/tutor/reports/create/:bookingId" element={<CreateReportPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="programs" element={<AdminProgramsPage />} />
            <Route path="tutors" element={<AdminTutorsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="blog" element={<AdminBlogPage />} />
            <Route path="blog-categories" element={<AdminBlogCategoriesPage />} />
            <Route path="testimonials" element={<AdminTestimonialsPage />} />
            <Route path="logs" element={<AdminActivityLogPage />} />
            <Route path="roles" element={<AdminRoleManagementPage />} />
            <Route path="settings" element={<div>Pengaturan (Segera)</div>} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
