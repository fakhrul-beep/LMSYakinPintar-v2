import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogIn, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { id: "beranda", label: "Beranda", path: "/" },
  { id: "subjects", label: "Program", path: "/subjects" },
  { id: "guru", label: "Guru", path: "/tutors" },
  { id: "testimoni", label: "Testimoni", path: "/testimonials" },
  { id: "blog", label: "Blog", path: "/blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavClick = (path) => {
    setOpen(false);
    // If it's an anchor link on home page
    if (path.startsWith("/#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const id = path.replace("/#", "");
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const id = path.replace("/#", "");
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(path);
    }
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/#")) {
      return location.pathname === "/" && location.hash === path.substring(1);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:py-6">
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="relative">
            <img src="/images/yakinpintar-logo.png" alt="YakinPintar Logo" className="h-12 w-auto transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute -inset-2 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
          </div>
          <div className="ml-4">
            <div className="text-xl font-black tracking-tight text-secondary leading-none mb-1">
              Yakin<span className="text-primary">Pintar</span>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Les Privat Juara
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100 mr-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-300 relative ${
                  isActive(item.path)
                    ? "text-primary bg-white shadow-sm ring-1 ring-slate-100"
                    : "text-slate-500 hover:text-secondary hover:bg-white/50"
                }`}
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />

          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 pl-2 pr-4 py-2 text-sm font-black text-secondary hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User size={20} />
                </div>
                <div className="text-left">
                  <p className="leading-none mb-1">{user.name.split(' ')[0]}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.role}</p>
                </div>
              </button>
              
              {profileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-200 z-20 overflow-hidden">
                    <div className="px-4 py-3 mb-2 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Akun Saya</p>
                      <p className="text-sm font-black text-secondary truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(user.role === 'admin' ? '/admin' : `/${user.role}`);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-secondary hover:bg-primary hover:text-white transition-all group"
                    >
                      <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all mt-1"
                    >
                      <LogOut size={18} />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="ml-2 flex items-center gap-3 rounded-2xl bg-secondary px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-secondary/10 hover:bg-primary hover:shadow-primary/30 transition-all active:scale-95 group"
            >
              Login
              <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        <button
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-secondary md:hidden border border-slate-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </nav>
      {open && (
        <div className="fixed inset-0 top-[89px] z-40 bg-white md:hidden overflow-y-auto">
          <div className="p-6 space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Navigasi Utama</p>
            <div className="grid grid-cols-1 gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`flex items-center justify-between w-full text-left text-lg font-black p-4 rounded-2xl transition-all ${
                    isActive(item.path) 
                      ? "text-primary bg-primary/5 ring-1 ring-primary/10" 
                      : "text-secondary hover:bg-slate-50"
                  }`}
                  onClick={() => handleNavClick(item.path)}
                >
                  {item.label}
                  {isActive(item.path) && <div className="h-2 w-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-base font-black text-secondary">{user.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate(user.role === 'admin' ? '/admin' : `/${user.role}`);
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary p-4 text-base font-black text-white shadow-xl shadow-primary/20"
                  >
                    <LayoutDashboard size={20} />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-base font-black text-red-600"
                  >
                    <LogOut size={20} />
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-secondary p-5 text-lg font-black text-white shadow-2xl shadow-secondary/20 active:scale-95 transition-all"
                >
                  Masuk ke Akun
                  <LogIn size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
