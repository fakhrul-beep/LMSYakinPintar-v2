import React, { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Search, 
  Filter, 
  BookOpen, 
  ChevronRight, 
  LayoutGrid, 
  List,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Virtuoso } from "react-virtuoso";
import api from "../utils/api";
import SectionWrapper from "../components/SectionWrapper";

// --- Caching Strategy ---
const CACHE_KEY = 'yakin_pintar_programs';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getCachedPrograms = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  return data;
};

const setCachedPrograms = (data) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

// --- Sub-components ---

const SubjectCard = ({ subject }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-lg shadow-slate-200/50 transition-all hover:shadow-2xl hover:border-primary/20"
    >
      {/* Thumbnail with Lazy Loading */}
      {subject.coverImage && (
        <div className="relative h-48 w-full overflow-hidden bg-slate-50">
          <img
            src={subject.coverImage}
            alt={subject.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Category Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] bg-primary/10 text-primary border-primary/20`}>
            {subject.category || 'Program'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
            {subject.name}
          </h3>
          <p className="mb-6 text-sm font-medium leading-relaxed text-slate-500 line-clamp-2">
            {subject.description}
          </p>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <BookOpen size={16} className="text-primary" />
            <span>{subject.duration || 'Waktu Fleksibel'}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="rounded-xl bg-slate-50 p-2.5 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Analytics Helper ---
const trackSubjectView = (subjectName) => {
  const views = JSON.parse(localStorage.getItem('subject_analytics') || '{}');
  views[subjectName] = (views[subjectName] || 0) + 1;
  localStorage.setItem('subject_analytics', JSON.stringify(views));
  console.log(`[Analytics] Subject viewed: ${subjectName}. Total views: ${views[subjectName]}`);
};

export default function SubjectsPage() {
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrograms = useCallback(async () => {
    // 1. Try Cache first
    const cached = getCachedPrograms();
    if (cached) {
      setPrograms(cached);
      setIsLoading(false);
    }

    try {
      const res = await api.get('/programs');
      const data = res.data.data.programs;
      setPrograms(data);
      setCachedPrograms(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch programs", err);
      if (!cached) {
        setError("Gagal memuat program. Silakan coba lagi nanti.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const categories = useMemo(() => {
    const cats = ["Semua", ...new Set(programs.map(p => p.category).filter(Boolean))];
    return cats;
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Semua" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [programs, searchQuery, activeCategory]);

  // Pagination Logic (Simplified for now, using all filtered items)
  const currentItems = filteredPrograms;

  // Analytics: Track search queries
  useEffect(() => {
    if (searchQuery.length > 3) {
      const timer = setTimeout(() => {
        console.log(`[Analytics] Searching for: ${searchQuery}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50/50 pt-24 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100 pb-16 pt-12">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
              <TrendingUp size={14} /> Explorer Akademik
            </span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1]">
              Daftar Program <br />
              <span className="text-primary">LMS YakinPintar</span>
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-lg font-medium text-slate-500 leading-relaxed">
              Temukan program belajar terbaik yang dirancang khusus untuk meningkatkan potensi Anda.
              Pilih dari berbagai kategori yang tersedia.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-14 mx-auto max-w-2xl"
          >
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-7 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Cari program belajar (ex: Intensif, Reguler...)"
                className="block w-full rounded-[2rem] border-2 border-slate-100 bg-white py-6 pl-16 pr-8 text-base font-bold text-slate-900 shadow-2xl shadow-slate-200/50 outline-none ring-primary/20 transition-all focus:border-primary/30 focus:ring-[12px] placeholder:font-medium placeholder:text-slate-400"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters & Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-32 space-y-10">
              <div>
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                  <Filter size={16} /> Filter Kategori
                </h3>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center justify-between rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                        activeCategory === cat
                          ? "bg-primary text-white shadow-xl shadow-primary/25"
                          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                      }`}
                    >
                      {cat}
                      {activeCategory === cat && <ChevronRight size={16} className="ml-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-colors" />
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Program</p>
                  <p className="text-4xl font-black mb-1">{filteredPrograms.length}</p>
                  <p className="text-xs font-medium text-slate-400">Tersedia untuk Anda</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-900">
                {activeCategory} <span className="text-slate-300 ml-2">({filteredPrograms.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 size={48} className="animate-spin text-primary" />
                <p className="font-bold text-slate-400">Memuat program...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <WifiOff size={40} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-900 mb-2">{error}</p>
                  <button 
                    onClick={fetchPrograms}
                    className="text-primary font-bold hover:underline"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            ) : filteredPrograms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredPrograms.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <AlertCircle size={40} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-900 mb-2">Tidak ada program ditemukan</p>
                  <p className="text-slate-500 font-medium">Coba gunakan kata kunci pencarian yang berbeda.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
