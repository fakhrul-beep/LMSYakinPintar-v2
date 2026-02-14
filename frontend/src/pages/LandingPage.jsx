import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  Home, 
  Smartphone, 
  BookOpen, 
  RefreshCcw, 
  DollarSign, 
  Gift, 
  MessageSquare, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  LogIn, 
  UserPlus, 
  GraduationCap,
  Star,
  Zap,
  Target,
  Trophy,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
  Video,
  Instagram,
  Music,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "../components/SectionWrapper";

// --- Components ---

const Badge = ({ children, color = "primary" }) => {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-secondary border-accent/20",
    coral: "bg-coral/10 text-coral border-coral/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.2em] ${colors[color]}`}>
      {children}
    </span>
  );
};

const AnimatedButton = ({ children, onClick, variant = "primary", className = "" }) => {
  const base = "flex items-center gap-3 rounded-[1.25rem] px-10 py-5 text-base font-black transition-all active:scale-95 shadow-xl focus:outline-none focus:ring-4";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-primary/20 focus:ring-primary/50",
    accent: "bg-accent text-secondary hover:bg-accent-hover shadow-accent/20 focus:ring-accent/50",
    neon: "bg-neon text-secondary hover:bg-green-400 shadow-neon/20 focus:ring-neon/50",
    coral: "bg-coral text-white hover:bg-orange-600 shadow-coral/20 focus:ring-coral/50",
    outline: "border-4 border-primary text-primary hover:bg-primary/5 shadow-none focus:ring-primary/50",
  };

  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const GlassCard = ({ children, className = "" }) => (
  <motion.div
    whileHover={{ y: -8 }}
    className={`rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const InteractiveQuiz = () => {
  const [step, setStep] = useState(0);
  const questions = [
    { q: "Apa tantangan terbesarmu saat belajar?", a: ["Gampang bosen 🥱", "Materi susah 🧩", "Kurang fokus 😵‍💫"] },
    { q: "Gimana cara belajarmu yang paling asik?", a: ["Sambil denger musik 🎧", "Diskusi bareng mentor 🗣️", "Visual/Gambar 🎨"] },
  ];

  if (step >= questions.length) {
    return (
      <GlassCard className="text-center border-accent/30 bg-accent/5">
        <Trophy className="mx-auto text-accent mb-6" size={56} />
        <h3 className="text-2xl font-black text-secondary mb-3">Kamu Siap Jadi Juara! 🏆</h3>
        <p className="text-base text-secondary-light mb-8">Berdasarkan jawabanmu, kamu cocok dengan Mentor yang komunikatif dan asik.</p>
        <AnimatedButton variant="accent" className="w-full justify-center">
          Dapatkan Mentor Sekarang
        </AnimatedButton>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="border-primary/30">
      <div className="flex justify-between items-center mb-8">
        <span className="text-xs font-black text-primary uppercase tracking-widest">Quiz Belajar</span>
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 w-10 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>
      <h3 className="text-2xl font-black text-secondary mb-8 leading-tight">{questions[step].q}</h3>
      <div className="space-y-4">
        {questions[step].a.map((ans, i) => (
          <button
            key={i}
            onClick={() => setStep(step + 1)}
            className="w-full p-5 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary hover:bg-primary/5 text-left text-base font-bold text-secondary transition-all flex justify-between items-center group"
          >
            {ans}
            <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </GlassCard>
  );
};

// --- Sections ---

function HeroSection({ variation = "A" }) {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-32 lg:pt-48 lg:pb-48">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-coral/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-10">
              <Badge color="primary">✨ #1 Choice for Gen Z</Badge>
            </div>
            <h1 className="text-6xl font-black tracking-tight text-secondary sm:text-7xl lg:text-8xl leading-[0.95] mb-10">
              Ubah Cara Belajarmu Jadi <span className="text-primary">Level Up!</span> 🚀
            </h1>
            <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-xl mb-12">
              Gak jaman belajar bosenin. Dapatkan guru asik untuk SD, SMP, SMA, hingga Ngaji. Jadwal fleksibel, dan progres belajar transparan. Fokus ke goals-mu, biar kami yang bantu jalannya!
            </p>
            
            <div className="flex flex-wrap gap-6 mb-20">
              <AnimatedButton onClick={() => navigate("/daftar-murid")} variant="primary">
                Mulai Belajar ⚡
              </AnimatedButton>
              <AnimatedButton onClick={() => navigate("/daftar-guru")} variant="outline" className="border-secondary text-secondary hover:bg-secondary/5">
                Jadi Mentor 🎓
              </AnimatedButton>
            </div>

            <div className="flex items-center gap-10 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 w-fit">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 w-16 rounded-2xl border-4 border-white bg-slate-200 overflow-hidden shadow-xl">
                    <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="user" className="h-full w-full object-cover" />
                  </div>
                ))}
                <div className="h-16 w-16 rounded-2xl border-4 border-white bg-secondary flex items-center justify-center text-white text-sm font-black shadow-xl">
                  +1k
                </div>
              </div>
              <div>
                <div className="flex text-accent gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={22} fill="currentColor" />)}
                </div>
                <p className="text-sm font-black text-secondary tracking-widest uppercase">4.9/5 Trust Score</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative lg:ml-auto w-full max-w-xl"
          >
            <div className="relative z-10">
              <InteractiveQuiz />
            </div>
            {/* Decorative Elements */}
            <motion.div
              animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-16 -right-16 z-0"
            >
              <div className="bg-coral p-6 rounded-[2rem] shadow-2xl shadow-coral/40">
                <Sparkles className="text-white" size={40} />
              </div>
            </motion.div>
            <motion.div
              animate={{ x: [0, 30, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-16 -left-16 z-0"
            >
              <div className="bg-accent p-6 rounded-[2rem] shadow-2xl shadow-accent/40">
                <Zap className="text-secondary" size={40} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { label: "Siswa Aktif", value: "1.2k+", icon: Users, color: "text-primary" },
    { label: "Mentor Pilihan", value: "500+", icon: GraduationCap, color: "text-coral" },
    { label: "Success Rate", value: "98%", icon: Target, color: "text-accent" },
    { label: "Achievements", value: "50+", icon: Trophy, color: "text-accent-hover" },
  ];

  return (
    <section className="py-32 bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      </div>
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group">
              <div className={`mx-auto mb-8 h-20 w-20 rounded-[2rem] bg-white/5 flex items-center justify-center ${stat.color} transition-all duration-500 group-hover:bg-white/10 group-hover:scale-110 group-hover:rotate-6`}>
                <stat.icon size={36} />
              </div>
              <div className="text-5xl font-black text-white mb-4 tracking-tight">{stat.value}</div>
              <div className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCards() {
  const features = [
    { 
      title: "Mentor Asik", 
      desc: "Guru yang datang sangat tepat waktu, komunikatif, dan paham gaya belajarmu.", 
      icon: "😎", 
      color: "border-primary/10 hover:border-primary/30 hover:bg-primary/5 shadow-primary/5" 
    },
    { 
      title: "Jadwal Chill", 
      desc: "Atur waktu les sesukamu, fleksibel banget untuk jadwal sibukmu!", 
      icon: "⏰", 
      color: "border-accent/10 hover:border-accent/30 hover:bg-accent/5 shadow-accent/5" 
    },
    { 
      title: "Progres Nyata", 
      desc: "Report belajar transparan tiap sesi membantu pantau perkembangan anak.", 
      icon: "📈", 
      color: "border-coral/10 hover:border-coral/30 hover:bg-coral/5 shadow-coral/5" 
    },
    { 
      title: "Program Lengkap", 
      desc: "Dari Akademik, Mengaji (Tajwid & Adab), hingga persiapan masuk PTN.", 
      icon: "📚", 
      color: "border-secondary/10 hover:border-secondary/30 hover:bg-secondary/5 shadow-secondary/5" 
    },
  ];

  return (
    <SectionWrapper
      id="features"
      title="Kenapa Kita Berbeda? ✨"
      subtitle="Belajar gak harus membosankan. Kita bawa vibe baru ke dunia edukasi dengan pendekatan yang lebih personal."
    >
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -12, scale: 1.02 }}
            className={`rounded-[3rem] border-2 p-10 transition-all duration-500 shadow-xl ${f.color}`}
          >
            <div className="text-6xl mb-10 transition-transform duration-500 group-hover:scale-110">{f.icon}</div>
            <h3 className="text-2xl font-black text-secondary mb-5 tracking-tight">{f.title}</h3>
            <p className="text-base font-bold text-slate-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function SocialProof() {
  const testimonials = [
    {
      name: "Ibu Rina",
      handle: "Orang Tua Murid",
      text: "Anak saya dari ranking 25 jadi 5 besar dalam 1 semester. Report belajar setiap sesi sangat membantu saya memantau perkembangan anak meski saya sibuk bekerja.",
      avatar: "https://i.pravatar.cc/150?u=rina",
      social: "instagram",
      location: "Ilir Barat, Palembang"
    },
    {
      name: "Pak Ardi",
      handle: "Orang Tua Murid",
      text: "Guru yang datang sangat tepat waktu dan komunikatif. Anak saya yang tadinya benci matematika sekarang jadi lebih semangat belajar karena cara mengajarnya seru.",
      avatar: "https://i.pravatar.cc/150?u=ardi",
      social: "instagram",
      location: "Seberang Ulu, Palembang"
    },
    {
      name: "Siska",
      handle: "Murid SMA",
      text: "Terima kasih YakinPintar! Berkat pendampingan intensif dari Kak Dinda, aku akhirnya lolos PTN impian lewat jalur SNBT. Materinya dijelaskan sampai paham banget.",
      avatar: "https://i.pravatar.cc/150?u=siska",
      social: "tiktok",
      location: "Sako, Palembang"
    },
    {
      name: "Ibu Maya",
      handle: "Orang Tua Murid",
      text: "Program mengaji di YakinPintar sangat bagus. Selain belajar tajwid, anak saya juga diajarkan adab dan doa-doa harian. Gurunya sabar sekali menghadapi anak kecil.",
      avatar: "https://i.pravatar.cc/150?u=maya",
      social: "instagram",
      location: "Kalidoni, Palembang"
    },
  ];

  return (
    <SectionWrapper
      id="testimoni"
      title="Apa Kata Mereka? 💬"
      subtitle="Dengarkan pengalaman langsung dari para orang tua dan murid yang telah bergabung dengan komunitas belajar YakinPintar."
    >
      <div className="grid gap-10 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -12 }}
            className="rounded-[3rem] bg-white p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group"
          >
            <div className="absolute top-8 right-8 text-slate-100 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
              {t.social === 'tiktok' ? <Music size={80} /> : <Instagram size={80} />}
            </div>
            <div className="flex items-center gap-6 mb-10">
              <img src={t.avatar} alt={t.name} className="h-20 w-20 rounded-2xl border-4 border-primary/10 object-cover shadow-xl" />
              <div>
                <h4 className="text-2xl font-black text-secondary">{t.name}</h4>
                <p className="text-sm font-black text-primary uppercase tracking-[0.2em]">{t.handle}</p>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{t.location}</p>
              </div>
            </div>
            <p className="text-xl text-slate-600 font-bold leading-relaxed italic">"{t.text}"</p>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-20 flex flex-wrap justify-center gap-8">
        <a href="#" className="flex items-center gap-4 rounded-2xl bg-secondary px-10 py-5 text-base font-black text-white hover:bg-primary transition-all shadow-xl shadow-secondary/10 hover:shadow-primary/30 group">
          <Music size={24} className="group-hover:rotate-12 transition-transform" /> Cek TikTok Kita
        </a>
        <a href="#" className="flex items-center gap-4 rounded-2xl bg-gradient-to-tr from-accent-400 via-coral to-purple-600 px-10 py-5 text-base font-black text-white transition-all shadow-xl shadow-coral/20 hover:scale-105 group">
          <Instagram size={24} className="group-hover:rotate-12 transition-transform" /> Follow Instagram
        </a>
        <button onClick={() => window.location.href='/testimonials'} className="flex items-center gap-4 rounded-2xl bg-white border-4 border-slate-100 px-10 py-5 text-base font-black text-secondary hover:border-primary hover:text-primary transition-all group">
          Lihat Semua Testimoni <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </SectionWrapper>
  );
}

function GamificationBanner() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-32">
      <div className="rounded-[3rem] bg-primary p-12 lg:p-20 relative overflow-hidden shadow-3xl shadow-primary/30">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Trophy size={280} className="text-white" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <Badge color="accent">Reward Program 🎁</Badge>
          <h2 className="mt-8 text-4xl lg:text-5xl font-black text-white leading-tight">
            Kumpulin XP, Dapetin Reward Keren!
          </h2>
          <p className="mt-8 text-xl text-white/90 font-medium leading-relaxed">
            Tiap sesi les nambahin XP-mu. Capai level tertentu buat dapetin merchandise eksklusif, diskon paket, dan badge keren di profilmu!
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-white font-black text-sm uppercase tracking-widest">Level 5: Rising Star ⭐</span>
              <span className="text-white font-black text-base">850 / 1000 XP</span>
            </div>
            <div className="h-8 w-full bg-white/20 rounded-full overflow-hidden p-1.5 border border-white/30">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: "85%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-accent rounded-full shadow-[0_0_20px_rgba(252,185,0,0.6)]" 
              />
            </div>
          </div>
          
          <div className="mt-12 flex flex-wrap gap-4">
            {[
              { icon: Zap, label: "Fast Learner" },
              { icon: Target, label: "Goal Getter" },
              { icon: Star, label: "High Achiever" }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                <badge.icon size={20} className="text-accent" />
                <span className="text-sm font-black text-white">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [variation, setVariation] = useState("A");

  // A/B Testing: Randomly select a variation on first load
  useEffect(() => {
    const savedVar = localStorage.getItem("ab_test_var");
    if (savedVar) {
      setVariation(savedVar);
    } else {
      const newVar = ["A", "B", "C"][Math.floor(Math.random() * 3)];
      setVariation(newVar);
      localStorage.setItem("ab_test_var", newVar);
    }
  }, []);

  return (
    <div className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>
      {/* Theme Toggle */}
      <div className="fixed top-24 right-4 z-50">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-2xl shadow-2xl transition-all ${darkMode ? 'bg-slate-800 text-amber-400' : 'bg-white text-slate-900'}`}
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <main className="transition-colors duration-500">
        <HeroSection variation={variation} />
        
        <StatsSection />
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <FeatureCards />
        </motion.div>

        <GamificationBanner />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <SocialProof />
        </motion.div>

        {/* CTA Section */}
        <section className="py-40 bg-secondary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
          </div>
          <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
            <Badge color="primary">Limited Time Offer ⏳</Badge>
            <h2 className="mt-12 text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter">
              Siap Jadi <span className="text-primary italic">Juara</span> Berikutnya? 🚀
            </h2>
            <p className="mt-12 text-2xl text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan 10.000+ siswa lainnya dan temukan cara belajar yang paling asik buat kamu.
            </p>
            <div className="mt-20 flex flex-wrap justify-center gap-8">
              <AnimatedButton variant="primary" className="px-20 py-8 text-2xl group">
                Daftar Sekarang!
                <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" />
              </AnimatedButton>
            </div>
            <p className="mt-10 text-sm font-black text-slate-500 uppercase tracking-[0.3em]">
              Gratis Konsultasi • Mentor Terverifikasi • Jadwal Fleksibel
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
