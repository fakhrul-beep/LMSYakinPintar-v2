import React from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  LogOut, 
  Settings,
  History,
  ShieldCheck,
  Bell,
  Search,
  UserCheck,
  CreditCard,
  MessageSquareQuote,
  FolderOpen
} from "lucide-react";

const SidebarItem = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
      active 
        ? "bg-primary text-white" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    {icon && React.createElement(icon, { size: 20 })}
    <span className="font-medium">{label}</span>
  </Link>
);

export default function AdminLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const menuItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/students", icon: UserCheck, label: "Siswa" },
    { to: "/admin/programs", icon: BookOpen, label: "Program" },
    { to: "/admin/tutors", icon: Users, label: "Guru" },
    { to: "/admin/payments", icon: CreditCard, label: "Pembayaran" },
    { to: "/admin/blog", icon: FileText, label: "Blog" },
    { to: "/admin/blog-categories", icon: FolderOpen, label: "Kategori Blog" },
    { to: "/admin/testimonials", icon: MessageSquareQuote, label: "Testimoni" },
    { to: "/admin/logs", icon: History, label: "Log Aktivitas" },
    { to: "/admin/roles", icon: ShieldCheck, label: "Role Admin" },
    { to: "/admin/settings", icon: Settings, label: "Pengaturan" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-100">
        <div className="flex h-16 items-center px-6">
          <img src="/images/yakinpintar-logo.png" alt="YakinPintar Logo" className="h-10" />
        </div>
        
        <nav className="mt-4 space-y-1 px-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-red-600/10 hover:text-red-500"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-8 shadow-sm">
          <div className="flex items-center gap-4 text-slate-500">
            <img src="/images/yakinpintar-logo.png" alt="YakinPintar Logo" className="h-8" />
            <Search size={20} />
            <input
              type="text"
              placeholder="Cari data..."
              className="bg-transparent text-sm outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-900">
              <Bell size={20} />
              <span className="absolute -right-1 -top-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
