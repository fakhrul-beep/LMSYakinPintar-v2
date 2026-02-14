import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, MessageCircle, MapPin, Mail, Phone, ChevronRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white pt-24 pb-12 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center">
                <img src="/images/yakinpintar-logo.png" alt="Logo" className="h-8 w-auto" />
              </div>
              <div className="text-2xl font-black tracking-tight">
                Yakin<span className="text-primary">Pintar</span>
              </div>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Platform bimbingan belajar terbaik yang menghadirkan guru juara langsung ke rumah Anda. Belajar lebih efektif, personal, dan menyenangkan.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Instagram, href: "#", color: "hover:bg-pink-500" },
                { icon: Youtube, href: "#", color: "hover:bg-red-600" },
                { icon: MessageCircle, href: "https://wa.me/6281234567890", color: "hover:bg-green-500" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  className={`h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-black mb-8 uppercase tracking-widest text-primary">Program Kami</h4>
            <ul className="space-y-4">
              {[
                { label: "SD / MI", path: "/subjects" },
                { label: "SMP / MTs", path: "/subjects" },
                { label: "SMA / MA / SMK", path: "/subjects" },
                { label: "UTBK & SBMPTN", path: "/subjects" },
                { label: "Bahasa Asing", path: "/subjects" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    className="group flex items-center text-slate-400 hover:text-white transition-colors font-bold"
                  >
                    <ChevronRight size={16} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-black mb-8 uppercase tracking-widest text-primary">Hubungi Kami</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <MapPin size={18} className="text-primary group-hover:text-white" />
                </div>
                <span className="text-slate-400 font-medium leading-relaxed">
                  Jl. Jenderal Sudirman No. 123, Palembang, Sumatera Selatan
                </span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <Phone size={18} className="text-primary group-hover:text-white" />
                </div>
                <span className="text-slate-400 font-medium">+62 812 3456 7890</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <Mail size={18} className="text-primary group-hover:text-white" />
                </div>
                <span className="text-slate-400 font-medium">halo@yakinpintar.id</span>
              </li>
            </ul>
          </div>

          {/* Newsletter/Legal */}
          <div>
            <h4 className="text-lg font-black mb-8 uppercase tracking-widest text-primary">Informasi</h4>
            <div className="space-y-8">
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                <p className="text-sm font-bold text-slate-400 mb-4">Dapatkan info promo terbaru</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email Anda"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button className="bg-primary hover:bg-primary-dark p-2 rounded-xl transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="#" className="text-xs font-black text-slate-500 hover:text-white uppercase tracking-tighter">Kebijakan Privasi</Link>
                <Link to="#" className="text-xs font-black text-slate-500 hover:text-white uppercase tracking-tighter">Syarat & Ketentuan</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm font-bold">
            © {currentYear} <span className="text-white">YakinPintar</span>. Dibuat dengan ❤️ untuk Indonesia.
          </p>
          <div className="flex items-center gap-8">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/100?u=${i}`}
                  alt="User"
                  className="h-8 w-8 rounded-full border-2 border-secondary object-cover"
                />
              ))}
              <div className="h-8 px-3 rounded-full border-2 border-secondary bg-slate-800 flex items-center text-[10px] font-black">
                +10k Siswa
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
