import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  WifiOff, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  GraduationCap, 
  Briefcase,
  Clock,
  MapPin,
  Wallet,
  ArrowRight,
  Home,
  X,
  RefreshCcw,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import Breadcrumbs from "../components/Breadcrumbs";
import MultiAutocomplete from "../components/MultiAutocomplete";
import Autocomplete from "../components/Autocomplete";
import api from "../utils/api";
import { formatIDR, parseIDR } from "../utils/format";
import { validateImage, compressImage } from "../utils/image";

const STUDENT_GRADES = ["Preschool/TK", "SD", "SMP", "SMA/SMK", "Umum"];
const INDONESIAN_CITIES = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Palembang", "Makassar", 
  "Tangerang", "Depok", "Bekasi", "Bogor", "Yogyakarta", "Malang", "Denpasar",
  "Bandar Lampung", "Padang", "Pekanbaru", "Banjarmasin", "Pontianak", "Samarinda"
];

const Badge = ({ children, color = "primary" }) => {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-secondary border-accent/20",
    coral: "bg-coral/10 text-coral border-coral/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] ${colors[color]}`}>
      {children}
    </span>
  );
};

export default function DaftarGuruPage() {
  const isOnline = useNetworkStatus();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    whatsapp: "",
    education: "",
    experience: '',
    selectedSubjects: [], // Array of objects {id, name}
    selectedSpecializations: [], // Array of objects {id, name}
    studentGrades: [],
    hourlyRate: "",
    city: "",
    area: "",
    availability: "",
  });

  // Dynamic Correlation States
  const [subjects, setSubjects] = useState([]);
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [specError, setSpecError] = useState(null);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("spesialisasi/subjects");
        setSubjects(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch specializations when selected subjects change
  const fetchSpecializations = useCallback(async (subjectIds) => {
    if (!subjectIds || subjectIds.length === 0) {
      setAvailableSpecializations([]);
      return;
    }
    setLoadingSpecs(true);
    setSpecError(null);
    try {
      // Fetch specializations for all selected subjects
      const promises = subjectIds.map(id => api.get(`spesialisasi/by-mata-pelajaran/${id}`));
      const responses = await Promise.all(promises);
      
      // Merge and deduplicate specializations
      const allSpecs = [];
      const seenIds = new Set();
      
      responses.forEach(res => {
        const specs = res.data?.data || [];
        specs.forEach(spec => {
          if (!seenIds.has(spec.id)) {
            seenIds.add(spec.id);
            allSpecs.push(spec);
          }
        });
      });
      
      setAvailableSpecializations(allSpecs);
      
      // Filter out selected specializations that are no longer available
      const filteredSelectedSpecs = form.selectedSpecializations.filter(selected => 
        seenIds.has(selected.id)
      );
      
      if (filteredSelectedSpecs.length !== form.selectedSpecializations.length) {
        setForm(prev => ({ ...prev, selectedSpecializations: filteredSelectedSpecs }));
      }
      
    } catch (err) {
      setSpecError("Gagal mengambil data spesialisasi. Silakan periksa koneksi internet Anda.");
      console.error("Failed to fetch specializations", err);
    } finally {
      setLoadingSpecs(false);
    }
  }, [form.selectedSpecializations]);

  useEffect(() => {
    const subjectIds = form.selectedSubjects.map(s => s.id);
    const timer = setTimeout(() => {
      fetchSpecializations(subjectIds);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [form.selectedSubjects, fetchSpecializations]);
  
  const [files, setFiles] = useState({
    photo: null,
    cv: null,
    certificate: null
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validateField = (name, value) => {
    let error = "";
    if (name === "fullName" && value.length < 3) error = "Nama lengkap minimal 3 karakter";
    if (name === "email" && !/\S+@\S+\.\S+/.test(value)) error = "Email tidak valid";
    if (name === "whatsapp" && !/^\d{10,}$/.test(value)) error = "Nomor WhatsApp minimal 10 digit angka";
    if (name === "hourlyRate" && isNaN(parseIDR(value))) error = "Tarif harus berupa angka";
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      const updatedGrades = checked 
        ? [...form.studentGrades, value]
        : form.studentGrades.filter(g => g !== value);
      setForm(prev => ({ ...prev, studentGrades: updatedGrades }));
    } else if (name === "hourlyRate") {
      // Handle currency input
      const numericValue = parseIDR(value);
      const formatted = formatIDR(numericValue);
      setForm(prev => ({ ...prev, [name]: formatted }));
      const fieldError = validateField(name, formatted);
      setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      const fieldError = validateField(name, value);
      setValidationErrors(prev => ({ ...prev, [name]: fieldError }));
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    const validation = validateImage(file);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    try {
      setError("");
      setUploadProgress(10);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setUploadProgress(40);
      };
      reader.readAsDataURL(file);

      // Compress
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
      
      setUploadProgress(100);
      setFiles(prev => ({ ...prev, photo: compressedFile }));
      
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error("Photo processing error:", err);
      setError("Gagal memproses foto. Silakan coba lagi.");
      setUploadProgress(0);
    }
  };

  const removePhoto = () => {
    setFiles(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    setUploadProgress(0);
  };

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    if (uploadedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: uploadedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!isOnline) {
      setError("Anda sedang offline. Silakan cek koneksi internet Anda.");
      return;
    }

    if (form.studentGrades.length === 0) {
      setError("Pilih minimal satu jenjang siswa yang diajarkan.");
      return;
    }
    if (form.password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      // Use FormData to support file uploads
      const formData = new FormData();
      
      // Append form fields
      Object.keys(form).forEach(key => {
        let value = form[key];
        let fieldName = key;

        // Map frontend field names to backend expected names
        if (key === 'fullName') fieldName = 'name';
        
        if (key === 'studentGrades') {
          value = Array.isArray(form[key]) 
            ? form[key].map(g => (typeof g === 'object' ? g.id : g)).join(',') 
            : form[key];
        }
        
        if (key === 'selectedSubjects') {
          fieldName = 'mata_pelajaran_id';
          value = form.selectedSubjects.map(s => s.id).join(',');
        }

        if (key === 'selectedSpecializations') {
          fieldName = 'spesialisasi_id';
          value = form.selectedSpecializations.map(s => s.id).join(',');
        }
        
        formData.append(fieldName, value);
      });

      // Append files
      if (files.photo) formData.append('photo', files.photo);
      if (files.cv) formData.append('cv', files.cv);
      if (files.certificate) formData.append('certificate', files.certificate);

      // Use AuthContext register with FormData
      const result = await register(formData, 'tutor');
      
      if (result.success) {
        setSubmitted(true);
        window.scrollTo(0, 0);
      } else {
        setError(result.message || "Terjadi kesalahan saat pendaftaran.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Terjadi kesalahan saat pendaftaran. Silakan cek kembali data Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-xl px-4 text-center"
        >
          <div className="relative mb-10 inline-flex">
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 opacity-75"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
          </div>
          
          <Badge color="primary">Pendaftaran Terkirim</Badge>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900">
            Selamat Datang di <span className="text-primary">YakinPintar!</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Terima kasih telah mendaftar sebagai mitra pengajar. Akun Anda telah berhasil dibuat. Silakan lengkapi profil Anda di dashboard untuk mulai menerima permintaan les.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/tutor"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-accent hover:shadow-2xl hover:shadow-primary/30"
            >
              <span>Dashboard Tutor</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/"
              className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-lg shadow-slate-200/50 transition-all hover:bg-slate-50"
            >
              <Home className="h-5 w-5" />
              <span>Beranda</span>
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-primary pt-16 pb-20 text-white">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <Breadcrumbs />
          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <Badge color="accent">Join Our Mission</Badge>
              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Bagikan Ilmu, <span className="text-accent">Bangun Masa Depan.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-100/90 max-w-2xl">
                Bergabunglah dengan komunitas pengajar terbaik di Indonesia. Bantu ribuan siswa meraih prestasi maksimal dengan metode pengajaran yang inovatif dan personal.
              </p>
            </div>
            {!isOnline && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 text-sm font-bold text-white shadow-xl">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                <WifiOff size={16} />
                Mode Offline
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-10 max-w-4xl px-4">

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Informasi Pribadi */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-[2.5rem] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100"
          >
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <User size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Informasi Pribadi</h2>
                <p className="text-sm font-medium text-slate-500">Lengkapi data diri Anda sesuai identitas resmi</p>
              </div>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-2.5">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Nama Lengkap</label>
                <div className="group relative">
                  <User className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border-2 ${validationErrors.fullName ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50/50'} py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-primary/5`}
                    placeholder="Nama Lengkap sesuai Identitas"
                  />
                </div>
                {validationErrors.fullName && <p className="ml-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">{validationErrors.fullName}</p>}
              </div>

              <div className="space-y-2.5">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Email Aktif</label>
                <div className="group relative">
                  <Mail className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border-2 ${validationErrors.email ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50/50'} py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-primary/5`}
                    placeholder="email@contoh.com"
                  />
                </div>
                {validationErrors.email && <p className="ml-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2.5">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Nomor WhatsApp</label>
                <div className="group relative">
                  <Phone className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <input
                    type="tel"
                    name="whatsapp"
                    required
                    value={form.whatsapp}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border-2 ${validationErrors.whatsapp ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50/50'} py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-primary/5`}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                {validationErrors.whatsapp && <p className="ml-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">{validationErrors.whatsapp}</p>}
              </div>

              <div className="space-y-2.5">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Kata Sandi</label>
                <div className="group relative">
                  <Briefcase className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-primary/5"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 2: Data Profesional */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-visible rounded-[2.5rem] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100"
          >
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-inner">
                <Briefcase size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Data Profesional</h2>
                <p className="text-sm font-medium text-slate-500">Tunjukkan kualifikasi dan pengalaman Anda</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2.5">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Pendidikan Terakhir / Sedang Ditempuh</label>
                <div className="group relative">
                  <GraduationCap className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-secondary" />
                  <input
                    type="text"
                    name="education"
                    required
                    value={form.education}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-secondary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-secondary/5"
                    placeholder="Contoh: S1 Pendidikan Matematika - Universitas Sriwijaya"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Pengalaman Mengajar</label>
                <textarea
                  name="experience"
                  required
                  rows={4}
                  value={form.experience}
                  onChange={handleChange}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-secondary/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-secondary/5"
                  placeholder="Ceritakan singkat pengalaman mengajar Anda (formal/non-formal)"
                />
              </div>

              <div className="space-y-6 relative">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Mata Pelajaran</label>
                    <MultiAutocomplete
                      name="selectedSubjects"
                      options={subjects}
                      value={form.selectedSubjects}
                      onChange={handleChange}
                      placeholder="Ketik mata pelajaran..."
                      icon={BookOpen}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Spesialisasi</label>
                    <MultiAutocomplete
                      name="selectedSpecializations"
                      options={availableSpecializations}
                      value={form.selectedSpecializations}
                      onChange={handleChange}
                      placeholder={form.selectedSubjects.length === 0 ? "Pilih mata pelajaran dahulu" : "Ketik spesialisasi..."}
                      icon={Briefcase}
                      loading={loadingSpecs}
                      error={specError}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 3: Preferensi Mengajar */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-visible rounded-[2.5rem] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100"
          >
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-coral shadow-inner">
                <Clock size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Preferensi Mengajar</h2>
                <p className="text-sm font-medium text-slate-500">Tentukan jadwal dan tarif yang Anda inginkan</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Jenjang Siswa yang Diajarkan</label>
                <MultiAutocomplete
                  name="studentGrades"
                  options={STUDENT_GRADES.map(g => ({ id: g, name: g }))}
                  value={form.studentGrades.map(g => (typeof g === 'object' ? g : { id: g, name: g }))}
                  onChange={handleChange}
                  placeholder="Pilih jenjang siswa..."
                  icon={GraduationCap}
                />
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Ekspektasi Tarif / Jam (Rp)</label>
                  <div className="group relative">
                    <Wallet className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-coral" />
                    <input
                      type="text"
                      name="hourlyRate"
                      required
                      value={form.hourlyRate}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-coral/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-coral/5"
                      placeholder="Contoh: 50000"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Ketersediaan Waktu</label>
                  <div className="group relative">
                    <Clock className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-coral" />
                    <input
                      type="text"
                      name="availability"
                      required
                      value={form.availability}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-coral/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-coral/5"
                      placeholder="Contoh: Sore hari (Senin - Jumat)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Kota Domisili</label>
                  <Autocomplete
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    options={INDONESIAN_CITIES}
                    placeholder="Contoh: Palembang"
                    icon={MapPin}
                    suggestionClassName="z-[100]"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Kecamatan / Area Mengajar</label>
                  <div className="group relative">
                    <MapPin className="absolute left-5 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-coral" />
                    <input
                      type="text"
                      name="area"
                      required
                      value={form.area}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 pl-14 pr-6 text-sm font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-coral/30 focus:bg-white focus:outline-none focus:ring-8 focus:ring-coral/5"
                      placeholder="Contoh: Ilir Barat I, Bukit Kecil"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 4: Dokumen Pendukung */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-visible rounded-[2.5rem] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100"
          >
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Upload size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Dokumen Pendukung</h2>
                <p className="text-sm font-medium text-slate-500">Unggah dokumen pelengkap pendaftaran</p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-3">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Foto Profil</label>
                <div className="relative">
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  
                  <div className="relative overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-primary/50 min-h-[160px] flex items-center justify-center">
                    {photoPreview ? (
                      <div className="relative group aspect-square w-full h-full overflow-hidden rounded-[1.5rem]">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label 
                            htmlFor="photo-upload"
                            className="p-3 bg-white rounded-full text-slate-700 hover:bg-primary hover:text-white transition-all cursor-pointer"
                          >
                            <Upload size={20} />
                          </label>
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="p-3 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center gap-4 py-10 w-full h-full cursor-pointer group"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white text-slate-400 group-hover:bg-primary group-hover:text-white shadow-sm transition-all">
                          <ImageIcon size={28} />
                        </div>
                        <div className="text-center">
                          <span className="block text-xs font-black uppercase tracking-wider text-slate-600">Pilih Foto</span>
                          <span className="mt-1 block text-[10px] font-medium text-slate-400">JPG, PNG (Maks 2MB)</span>
                        </div>
                      </label>
                    )}

                    {/* Progress Bar */}
                    <AnimatePresence>
                      {uploadProgress > 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100"
                        >
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Curriculum Vitae (CV)</label>
                <div className="relative">
                  <input
                    type="file"
                    name="cv"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-upload"
                  />
                  <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-primary/50 hover:bg-primary/5 min-h-[160px] flex items-center justify-center">
                    <label
                      htmlFor="cv-upload"
                      className="flex flex-col items-center justify-center gap-4 p-8 w-full h-full cursor-pointer group"
                    >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${files.cv ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 group-hover:text-primary'} shadow-sm transition-colors`}>
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-black uppercase tracking-wider text-slate-600">
                          {files.cv ? 'Terpilih' : 'Pilih CV (PDF)'}
                        </span>
                        {files.cv && <span className="mt-1 block text-[10px] font-medium text-slate-400 truncate max-w-[120px]">{files.cv.name}</span>}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Sertifikat (Opsional)</label>
                <div className="relative">
                  <input
                    type="file"
                    name="certificate"
                    accept=".pdf,.jpg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cert-upload"
                  />
                  <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-primary/50 hover:bg-primary/5 min-h-[160px] flex items-center justify-center">
                    <label
                      htmlFor="cert-upload"
                      className="flex flex-col items-center justify-center gap-4 p-8 w-full h-full cursor-pointer group"
                    >
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${files.certificate ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 group-hover:text-primary'} shadow-sm transition-colors`}>
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-black uppercase tracking-wider text-slate-600">
                          {files.certificate ? 'Terpilih' : 'Pilih Sertifikat'}
                        </span>
                        {files.certificate && <span className="mt-1 block text-[10px] font-medium text-slate-400 truncate max-w-[120px]">{files.certificate.name}</span>}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-8 text-[11px] font-bold text-slate-400 italic flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle size={14} />
              Maksimal 2MB per dokumen (JPG, PNG, PDF).
            </p>
          </motion.section>

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting || !isOnline || (form.mata_pelajaran_id && !form.spesialisasi_id)}
              className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-primary px-8 py-5 text-xl font-black text-white shadow-2xl shadow-primary/30 transition-all hover:bg-accent hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 translate-y-full bg-gradient-to-t from-black/10 to-transparent transition-transform group-hover:translate-y-0" />
              {submitting ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin" />
                  <span className="relative">Memproses...</span>
                </>
              ) : (
                <>
                  <span className="relative">Kirim Pendaftaran Guru</span>
                  <ArrowRight className="relative h-6 w-6 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <p className="mt-6 text-center text-xs font-medium text-slate-500">
              Dengan mendaftar, Anda menyetujui <Link to="/terms" className="font-bold text-primary hover:underline">Syarat & Ketentuan</Link> mitra pengajar.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
