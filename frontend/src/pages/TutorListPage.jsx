import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { 
  RefreshCw, 
  WifiOff, 
  AlertCircle, 
  Search, 
  Filter, 
  MapPin, 
  GraduationCap, 
  Star,
  CheckCircle2,
  Users,
  Trophy,
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import Breadcrumbs from "../components/Breadcrumbs";

// --- Sub-components ---

const TutorCard = ({ tutor, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8 }}
      className="group flex flex-col rounded-[2.5rem] bg-white overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:border-primary/20"
    >
      <div className="relative h-72 overflow-hidden bg-slate-100 cursor-pointer" onClick={onClick}>
        <img
          src={tutor.profile_photo || `https://i.pravatar.cc/400?u=${tutor.id}`}
          alt={tutor.user?.name || "Guru"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {tutor.is_verified && (
            <div className="flex items-center gap-2 rounded-full bg-primary/90 backdrop-blur-md px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg">
              <CheckCircle2 size={14} /> Terverifikasi
            </div>
          )}
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md px-4 py-2 text-sm font-black text-secondary shadow-xl border border-slate-100">
          <Star size={16} className="fill-accent text-accent" />
          {Number(tutor.rating_average || 0).toFixed(1)}
        </div>

        {/* Floating Subject Badge */}
        <div className="absolute bottom-6 left-6 right-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex flex-wrap gap-2">
            {tutor.subjects?.slice(0, 2).map((sub, idx) => (
              <span key={idx} className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/30">
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-10 flex-1 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-black text-secondary group-hover:text-primary transition-colors line-clamp-1">
              {tutor.user?.name || "Nama Guru"}
            </h3>
            <Award size={24} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-base font-bold text-primary tracking-wide uppercase">
            {tutor.subjects?.join(" • ") || "General Mentor"}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-coral shadow-sm">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1.5">Pengalaman</p>
              <p className="text-sm font-bold text-secondary">{tutor.experience_years || 0}+ Thn</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1.5">Lokasi</p>
              <p className="text-sm font-bold text-secondary truncate">{tutor.city || "Palembang"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClick}
          className="mt-auto group/btn flex items-center justify-center gap-3 w-full rounded-2xl bg-[#3C5DFF] py-5 text-base font-black text-white hover:bg-[#FCB900] hover:text-slate-900 transition-all duration-300 shadow-xl shadow-[#3C5DFF]/20 hover:shadow-[#FCB900]/40 focus:outline-none focus:ring-4 focus:ring-[#3C5DFF]/20 active:scale-[0.98]"
        >
          Lihat Profil Lengkap
          <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default function TutorListPage() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(location.search);
      const programFilter = params.get("program");
      
      let url = "/tutors";
      if (programFilter) {
        url += `?subject=${programFilter}`;
      }

      const response = await api.get(url);
      setTutors(response.data);
    } catch (err) {
      console.error("Failed to fetch tutors:", err);
      setError(err.friendlyMessage || "Gagal memuat daftar guru. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const filteredTutors = useMemo(() => {
    return tutors.filter(tutor => 
      tutor.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tutors, searchQuery]);

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden bg-slate-900 pt-32 pb-48 lg:pt-40 lg:pb-64">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-electric/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-coral/20 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Breadcrumbs className="justify-center mb-8 text-slate-400" />
            <span className="inline-flex items-center gap-2 rounded-full bg-electric/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-electric mb-8 border border-electric/20">
              <Sparkles size={14} /> Expert Mentors
            </span>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
              Temukan <span className="text-electric">Mentor</span> Terbaik <br />
              Untuk Masa Depanmu 🎓
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-lg font-medium text-slate-400 leading-relaxed">
              Kami telah menyeleksi guru-guru terbaik dari universitas ternama untuk mendampingi perjalanan belajarmu. 
              Pilih yang paling cocok dengan gaya belajarmu!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <div className="group relative h-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-7 pointer-events-none text-slate-400 group-focus-within:text-[#3C5DFF] transition-colors">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru atau mata pelajaran spesifik..."
                className="block w-full h-full rounded-[1.5rem] md:rounded-[2rem] border-0 bg-white py-5 md:py-6 pl-16 pr-6 text-base md:text-lg font-bold text-slate-900 shadow-xl md:shadow-2xl shadow-slate-200/50 outline-none ring-4 ring-transparent transition-all focus:ring-[#3C5DFF]/20 placeholder:text-slate-500"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-[1.5rem] md:rounded-[2rem] px-6 md:px-8 py-5 md:py-6 shadow-xl md:shadow-2xl shadow-slate-200/50 flex items-center justify-between border border-slate-50 md:min-w-[300px] transition-transform"
          >
            <div className="flex items-center gap-4 md:gap-5">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-[#3C5DFF]/10 flex items-center justify-center text-[#3C5DFF]">
                <Users size={24} className="md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5 md:mb-2">Tersedia</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{filteredTutors.length}</span>
                  <span className="text-xs md:text-sm font-bold text-slate-400">Guru</span>
                </div>
              </div>
            </div>
            {!isOnline && (
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-pulse shrink-0 ml-4">
                <WifiOff size={20} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Content Area */}
        <div className="mt-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mb-6"
              >
                <RefreshCw size={48} className="text-electric" />
              </motion.div>
              <p className="text-xl font-black text-slate-900">Mencari mentor terbaik...</p>
              <p className="text-slate-400 mt-2 font-medium">Hanya butuh beberapa detik</p>
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[3rem] bg-white p-16 text-center shadow-3xl shadow-slate-200/50 border border-red-50"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 mb-8">
                <AlertCircle size={48} className="text-red-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">Waduh, Ada Kendala!</h3>
              <p className="text-slate-500 text-lg max-w-md mx-auto mb-10">{error}</p>
              <button
                onClick={fetchTutors}
                className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-lg font-black text-white hover:bg-electric transition-all shadow-2xl shadow-slate-900/20"
              >
                <RefreshCw size={20} /> Coba Muat Ulang
              </button>
            </motion.div>
          ) : filteredTutors.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[3rem] bg-white p-24 text-center shadow-3xl shadow-slate-200/50 border border-dashed border-slate-200"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 mb-8">
                <Search size={48} className="text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">Guru tidak ditemukan</h3>
              <p className="text-slate-500 text-lg mb-10">Coba gunakan kata kunci lain atau bersihkan pencarian.</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="font-black text-electric hover:underline text-lg"
              >
                Tampilkan Semua Guru
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredTutors.map((tutor) => (
                  <TutorCard 
                    key={tutor.id} 
                    tutor={tutor} 
                    onClick={() => navigate(`/tutors/${tutor.id}`)} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Trust Section */}
      <div className="mt-32 border-t border-slate-100 pt-32">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-16">Kenapa Belajar Bersama Guru YakinPintar?</h2>
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { title: "Seleksi Ketat", desc: "Hanya 5% pendaftar terbaik yang kami terima sebagai mentor.", icon: CheckCircle2, color: "text-electric" },
              { title: "Background Check", desc: "Verifikasi dokumen akademik dan rekam jejak mengajar yang valid.", icon: Award, color: "text-coral" },
              { title: "Training Intensif", desc: "Setiap mentor dibekali pelatihan kurikulum dan psikologi anak.", icon: GraduationCap, color: "text-accent" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`mb-6 h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center ${item.color}`}>
                  <item.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{item.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
