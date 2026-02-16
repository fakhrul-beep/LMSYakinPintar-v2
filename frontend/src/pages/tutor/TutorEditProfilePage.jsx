import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Briefcase, 
  Shield, 
  History, 
  Camera, 
  Save, 
  Eye, 
  RotateCcw, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  X,
  Upload,
  Lock,
  Star,
  RefreshCcw,
  Heart,
  Share2,
  Award,
  Clock,
  Calendar,
  ShieldCheck,
  Globe,
  Search,
  ChevronDown,
  MapPin,
  MessageSquare,
  Plus,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import MultiAutocomplete from '../../components/MultiAutocomplete';

const INDONESIA_CITIES = [
  "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur",
  "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Tangerang",
  "Depok", "Semarang", "Bekasi", "Tangerang Selatan", "Bogor", "Batam", "Pekanbaru",
  "Bandar Lampung", "Malang", "Padang", "Denpasar", "Samarinda", "Tasikmalaya",
  "Serang", "Banjarmasin", "Pontianak", "Cimahi", "Balikpapan", "Jambi", "Surakarta",
  "Mataram", "Manado", "Yogyakarta", "Cilegon", "Kupang", "Palu", "Ambon", "Tarakan",
  "Sukabumi", "Cirebon", "Bengkulu", "Pekalongan", "Kediri", "Tegal", "Binjai",
  "Pematangsiantar", "Jayapura", "Banda Aceh", "Palangkaraya", "Probolinggo",
  "Banjarbaru", "Pasuruan", "Tanjungpinang", "Madiun", "Dumai", "Salatiga",
  "Blitar", "Singkawang", "Bontang", "Tanjungbalai", "Metro", "Tebing Tinggi",
  "Batu", "Bitung", "Pagar Alam", "Lubuklinggau", "Padangsidempuan", "Tual",
  "Sorong", "Bima", "Bau-Bau", "Langsa", "Banjar", "Prabumulih", "Mojokerto",
  "Palopo", "Magelang", "Payakumbuh", "Bukittinggi", "Kotamobagu", "Parepare",
  "Tidore Kepulauan", "Pariaman", "Tomohon", "Sibolga", "Solok", "Sawahlunto",
  "Padang Panjang", "Sabang", "Subulussalam"
].sort();

const TutorEditProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [versions, setVersions] = useState([]);
  const [errors, setErrors] = useState({});
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [isCustomCity, setIsCustomCity] = useState(false);

  const POPULAR_SUBJECTS = [
    "Matematika", "Bahasa Inggris", "Bahasa Indonesia", "Fisika", "Kimia", "Biologi",
    "Ekonomi", "Akuntansi", "Geografi", "Sejarah", "Sosiologi", "IPA", "IPS",
    "Komputer", "Coding", "Musik", "Seni Lukis", "Mengaji", "Bahasa Mandarin",
    "Bahasa Jepang", "Bahasa Korea", "Bahasa Arab", "Bahasa Jerman"
  ].sort();
  
  const STUDENT_GRADES = ["Preschool/TK", "SD", "SMP", "SMA/SMK", "Umum"];

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    whatsapp: '',
    profile_photo: '',
    education: '',
    experience: '',
    subjects: [],
    student_grades: [],
    hourly_rate: 0,
    city: '',
    area: '',
    availability: '',
    certifications: [],
    privacy_settings: {
      show_email: false,
      show_whatsapp: true
    }
  });

  const [accountSettings, setAccountSettings] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchVersions();

    // Listen for database sync status from axios interceptor
    const handleSyncStatus = (e) => {
      const { isSyncing: syncing, message } = e.detail;
      setIsSyncing(syncing);
      if (syncing) {
        setSyncMessage(message || "Sinkronisasi skema database sedang berlangsung...");
      }
    };

    window.addEventListener('database-sync-status', handleSyncStatus);
    return () => window.removeEventListener('database-sync-status', handleSyncStatus);
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.data;
      const initialCity = userData.profile?.city || '';
      
      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        whatsapp: userData.whatsapp || '',
        profile_photo: userData.profile?.profile_photo || '',
        education: userData.profile?.education || '',
        experience: userData.profile?.experience || '',
        subjects: userData.profile?.subjects || [],
        student_grades: userData.profile?.student_grades || [],
        hourly_rate: userData.profile?.hourly_rate || 0,
        city: initialCity,
        area: userData.profile?.area || '',
        availability: userData.profile?.availability || '',
        certifications: userData.profile?.certifications || [],
        privacy_settings: userData.profile?.privacy_settings || { show_email: false, show_whatsapp: true }
      });

      // Check if current city is in predefined list
      if (initialCity && !INDONESIA_CITIES.includes(initialCity)) {
        setIsCustomCity(true);
        setCustomCity(initialCity);
      }
    } catch (error) {
      toast.error("Gagal mengambil data profil");
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await api.get('/users/profile/versions');
      setVersions(response.data.data);
    } catch (error) {
      const isSchemaError = error.response?.status === 503 || 
        (error.response?.status === 500 && error.response?.data?.message?.toLowerCase().includes("schema cache"));
      if (isSchemaError) {
        console.warn("[Sync] Fetching versions paused due to schema synchronization.");
      } else {
        console.error("Error fetching versions:", error);
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!profile.name) newErrors.name = "Nama wajib diisi";
    if (!profile.whatsapp) newErrors.whatsapp = "Nomor WhatsApp wajib diisi";
    if (profile.hourly_rate <= 0) newErrors.hourly_rate = "Tarif harus lebih dari 0";
    
    if (accountSettings.new_password) {
      if (!accountSettings.current_password) {
        newErrors.current_password = "Password saat ini wajib diisi untuk mengganti password";
      }
      if (accountSettings.new_password.length < 6) {
        newErrors.new_password = "Password minimal 6 karakter";
      }
      if (accountSettings.new_password !== accountSettings.confirm_password) {
        newErrors.confirm_password = "Konfirmasi password tidak cocok";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Real-time validation
    validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = "";
    if (field === 'name' && !value) error = "Nama wajib diisi";
    if (field === 'whatsapp' && !value) error = "Nomor WhatsApp wajib diisi";
    if (field === 'hourly_rate' && (isNaN(value) || value <= 0)) error = "Tarif harus lebih dari 0";

    setErrors(prev => {
      if (error) return { ...prev, [field]: error };
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleAccountInputChange = (field, value) => {
    setAccountSettings(prev => ({ ...prev, [field]: value }));
    
    let error = "";
    if (field === 'new_password' && value && value.length < 6) {
      error = "Password minimal 6 karakter";
    }
    if (field === 'confirm_password' && value !== accountSettings.new_password) {
      error = "Konfirmasi password tidak cocok";
    }
    if (field === 'current_password' && !value && accountSettings.new_password) {
      error = "Password saat ini wajib diisi";
    }

    setErrors(prev => {
      if (error) return { ...prev, [field]: error };
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    const loadingToast = toast.loading("Mengunggah foto...");
    try {
      const response = await api.post("users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(prev => ({ ...prev, profile_photo: response.data.data.url }));
      toast.success("Foto berhasil diunggah", { id: loadingToast });
    } catch (error) {
      toast.error("Gagal mengunggah foto", { id: loadingToast });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validation for availability
    try {
      const availabilityData = JSON.parse(profile.availability || '{}');
      const hasSelection = Object.values(availabilityData).some(hours => hours.length > 0);
      if (!hasSelection) {
        toast.error("Silakan pilih setidaknya satu hari dan jam ketersediaan di tab Profesional.");
        setActiveTab('professional');
        return;
      }
    } catch (err) {
      // If it's old legacy string data, we might want to allow it or force update
      // For now, let's just warn if it's not valid JSON and we're trying to save
      console.warn("Availability is not in JSON format");
    }

    setSaving(true);
    if (!validate()) {
      setSaving(false);
      toast.error("Silakan perbaiki kesalahan pada form");
      return;
    }

    setSaving(true);
    try {
      // 1. Update Profile Data
      const response = await api.put('/users/profile', {
        name: profile.name,
        whatsapp: profile.whatsapp,
        profile_photo: profile.profile_photo,
        profileData: {
          education: profile.education,
          experience: profile.experience,
          subjects: profile.subjects,
          student_grades: profile.student_grades,
          hourly_rate: profile.hourly_rate,
          city: profile.city,
          area: profile.area,
          availability: profile.availability,
          certifications: profile.certifications,
          privacy_settings: profile.privacy_settings
        }
      });

      // 2. Handle Password Change if needed
      if (accountSettings.new_password) {
        await api.post('/users/profile/password', {
          currentPassword: accountSettings.current_password,
          newPassword: accountSettings.new_password
        });
        setAccountSettings({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }

      if (response.data.status === 'success') {
        toast.success("Profil berhasil diperbarui");
        
        // Update local state and context
        const updatedUser = response.data.data;
        updateUserData(updatedUser);
        
        // Refresh local profile state to ensure UI reflects latest DB state
        setProfile({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          whatsapp: updatedUser.whatsapp || '',
          profile_photo: updatedUser.profile?.profile_photo || '',
          education: updatedUser.profile?.education || '',
          experience: updatedUser.profile?.experience || '',
          subjects: updatedUser.profile?.subjects || [],
          student_grades: updatedUser.profile?.student_grades || [],
          hourly_rate: updatedUser.profile?.hourly_rate || 0,
          city: updatedUser.profile?.city || '',
          area: updatedUser.profile?.area || '',
          availability: updatedUser.profile?.availability || '',
          certifications: updatedUser.profile?.certifications || [],
          privacy_settings: updatedUser.profile?.privacy_settings || { show_email: false, show_whatsapp: true }
        });

        fetchVersions(); // Refresh history
        setPreviewMode(false);
      }
    } catch (error) {
      const isSchemaError = error.response?.status === 503 || 
        (error.response?.status === 500 && error.response?.data?.message?.toLowerCase().includes("schema cache"));
      
      if (isSchemaError) {
        console.warn("[Sync] Form submission paused due to database schema sync. Handled by retry mechanism.");
        // We don't show toast error here because isSyncing is true and shows a banner
      } else {
        console.error("Update profile error:", error);
        const errorMessage = error.response?.data?.message || "Gagal memperbarui profil";
        toast.error(errorMessage);
      }
    } finally {
      // Only set saving to false if not a schema error that's being retried
      // Actually, axios retry is transparent, so if it reaches here, the retry failed
      setSaving(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!window.confirm("Apakah Anda yakin ingin mengembalikan profil ke versi ini?")) return;

    const loadingToast = toast.loading("Mengembalikan profil...");
    try {
      const response = await api.post('/users/profile/rollback', { versionId });
      if (response.data.status === 'success') {
        toast.success("Profil berhasil dikembalikan", { id: loadingToast });
        
        // Update context with rolled back data
        // Note: rollback endpoint returns tutor object, we need to fetch full profile or construct it
        await fetchProfile();
        
        // Update context after fetching full profile
        const fullProfileResponse = await api.get('/users/profile');
        updateUserData(fullProfileResponse.data.data);
      }
    } catch (error) {
      console.error("Rollback error:", error);
      toast.error("Gagal mengembalikan profil", { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-slate-500 font-medium">Memuat pengaturan profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/tutor')}
              className="p-2 hover:bg-slate-100 rounded-full transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Edit Profil Guru</h1>
              <p className="text-xs text-slate-500 font-medium">Kelola informasi publik dan akun Anda</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                previewMode ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {previewMode ? <X size={16} /> : <Eye size={16} />}
              {previewMode ? 'Tutup Preview' : 'Preview'}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={saving || isSyncing}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-accent transition-all disabled:opacity-50"
            >
              {saving || isSyncing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isSyncing ? 'Sinkronisasi...' : 'Menyimpan...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Sync Warning Banner */}
        {isSyncing && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-2 animate-pulse">
            <div className="max-w-6xl mx-auto flex items-center gap-2 text-amber-700 text-sm font-medium">
              <AlertCircle size={14} />
              <span>{syncMessage} Sistem akan mencoba menyimpan otomatis...</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: 'basic', label: 'Info Dasar', icon: User },
              { id: 'professional', label: 'Profesional', icon: Briefcase },
              { id: 'account', label: 'Akun & Privasi', icon: Shield },
              { id: 'history', label: 'Riwayat Perubahan', icon: History },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setPreviewMode(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-md shadow-primary/10' 
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}

            {/* Version Info for Troubleshooting */}
            <div className="mt-8 p-4 rounded-xl bg-slate-100/50 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Info</p>
              <div className="space-y-1">
                <p className="text-[11px] text-slate-500 flex justify-between">
                  <span>Versi:</span>
                  <span className="font-mono">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev-local'}</span>
                </p>
                <p className="text-[11px] text-slate-500 flex justify-between">
                  <span>Build:</span>
                  <span className="font-mono text-[9px]">{typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'just now'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {previewMode ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <Eye size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">Mode Preview Publik</h3>
                      <p className="text-[11px] text-amber-700">Ini adalah tampilan profil Anda yang akan dilihat oleh siswa.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewMode(false)}
                    className="px-4 py-2 bg-white text-amber-600 text-xs font-bold rounded-xl border border-amber-200 hover:bg-amber-100 transition-all"
                  >
                    Tutup Preview
                  </button>
                </div>

                {/* Identical to TutorProfilePage.jsx Layout */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                  <div className="relative h-48 bg-gradient-to-r from-primary to-blue-600">
                    <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-2xl border-4 border-white bg-slate-100 shadow-lg overflow-hidden">
                      <img 
                        src={profile.profile_photo || `https://ui-avatars.com/api/?name=${profile.name}&background=random`} 
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="pb-8 pl-44 pr-8 pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                          <CheckCircle2 className="h-6 w-6 fill-blue-500 text-white" />
                        </div>
                        <p className="mt-1 text-lg font-medium text-slate-600">
                          Ahli {profile.subjects?.join(', ') || 'Mata Pelajaran'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center text-slate-500">
                            <MapPin className="mr-1.5 h-4 w-4" />
                            {profile.city || 'Lokasi tidak diset'}
                          </div>
                          <div className="flex items-center text-amber-500 font-bold">
                            <Star className="mr-1.5 h-4 w-4 fill-amber-500" />
                            5.0 (0 Ulasan)
                          </div>
                          <div className="flex items-center text-slate-500">
                            <ShieldCheck className="mr-1.5 h-4 w-4 text-green-500" />
                            Identitas Terverifikasi
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                          <Heart className="h-5 w-5" />
                        </button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                          <RefreshCcw className="h-5 w-5" />
                        </button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex border-t border-slate-100 bg-slate-50/50">
                    <div className="flex-1 px-8 py-4 text-center">
                      <div className="text-xl font-bold text-slate-900">0+</div>
                      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Jam Mengajar</div>
                    </div>
                    <div className="h-auto w-px bg-slate-100"></div>
                    <div className="flex-1 px-8 py-4 text-center">
                      <div className="text-xl font-bold text-slate-900">0</div>
                      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Siswa Aktif</div>
                    </div>
                    <div className="h-auto w-px bg-slate-100"></div>
                    <div className="flex-1 px-8 py-4 text-center">
                      <div className="text-xl font-bold text-slate-900">0 Thn</div>
                      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Pengalaman</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-200">
                      <div className="flex gap-8 border-b border-slate-200 mb-8">
                        <button className="pb-4 text-sm font-bold border-b-2 border-primary text-primary">Tentang Guru</button>
                        <button className="pb-4 text-sm font-bold text-slate-400">Pendidikan</button>
                      </div>
                      <div className="space-y-6">
                        <section>
                          <h3 className="text-xl font-bold text-slate-900 mb-4">Profil Singkat</h3>
                          <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                            {profile.experience || 'Belum ada deskripsi profil.'}
                          </p>
                        </section>
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                              <GraduationCap size={24} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendidikan</p>
                              <p className="text-sm font-bold text-slate-900 mt-1">{profile.education || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                              <Globe size={24} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bahasa</p>
                              <p className="text-sm font-bold text-slate-900 mt-1">Indonesia, Inggris</p>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-200 sticky top-32">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900">Rp {profile.hourly_rate?.toLocaleString()}</span>
                          <span className="text-slate-500 text-sm font-medium">/ jam</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Booking Sekarang</button>
                        <button className="w-full py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 flex items-center justify-center gap-2">
                          <MessageSquare size={18} />
                          Tanya Guru
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-200">
                {activeTab === 'basic' && (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-slate-100">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-slate-100 overflow-hidden ring-4 ring-slate-50 transition-all group-hover:ring-primary/20">
                          {profile.profile_photo ? (
                            <img src={profile.profile_photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300">
                              {profile.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:bg-accent transition-all">
                          <Camera size={18} />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="font-bold text-slate-900">Foto Profil</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">Gunakan foto yang profesional agar siswa lebih percaya. Format JPG, PNG maksimal 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={profile.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full rounded-xl border ${errors.name ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                          {errors.name && <AlertCircle className="absolute right-3 top-3 text-red-500" size={18} />}
                        </div>
                        {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email (Hanya Baca)</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            value={profile.email}
                            disabled
                            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed"
                          />
                          <Lock className="absolute right-3 top-3 text-slate-300" size={18} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor WhatsApp</label>
                        <div className="relative">
                          <input 
                            type="tel" 
                            value={profile.whatsapp}
                            onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                            className={`w-full rounded-xl border ${errors.whatsapp ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                          {errors.whatsapp && <AlertCircle className="absolute right-3 top-3 text-red-500" size={18} />}
                        </div>
                        {errors.whatsapp && <p className="text-[10px] font-bold text-red-500">{errors.whatsapp}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kota Domisili</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCityDropdown(!showCityDropdown)}
                            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                          >
                            <span className={profile.city ? 'text-slate-900' : 'text-slate-400'}>
                              {profile.city || "Pilih Kota/Kabupaten"}
                            </span>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {showCityDropdown && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="p-3 border-b border-slate-50">
                                <div className="relative">
                                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                  <input
                                    type="text"
                                    placeholder="Cari kota..."
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="max-h-60 overflow-y-auto py-2">
                                {INDONESIA_CITIES.filter(city => 
                                  city.toLowerCase().includes(citySearch.toLowerCase())
                                ).map((city) => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('city', city);
                                      setIsCustomCity(false);
                                      setShowCityDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${profile.city === city ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600'}`}
                                  >
                                    {city}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomCity(true);
                                    handleInputChange('city', customCity || "");
                                    setShowCityDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-t border-slate-50 font-bold ${isCustomCity ? 'text-primary' : 'text-slate-900'}`}
                                >
                                  Lainnya...
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {isCustomCity && (
                          <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                            <input 
                              type="text" 
                              placeholder="Masukkan nama kota manual"
                              value={customCity}
                              onChange={(e) => {
                                setCustomCity(e.target.value);
                                handleInputChange('city', e.target.value);
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium italic">Nama kota akan divalidasi oleh sistem.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'professional' && (
                  <div className="space-y-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendidikan Terakhir</label>
                      <input 
                        type="text" 
                        value={profile.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        placeholder="Contoh: S1 Pendidikan Matematika - Universitas Indonesia"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mata Pelajaran yang Diajar</label>
                        <MultiAutocomplete
                          name="subjects"
                          options={POPULAR_SUBJECTS.map(s => ({ id: s, name: s }))}
                          value={profile.subjects.map(s => ({ id: s, name: s }))}
                          onChange={(e) => {
                            const newSubjects = e.target.value.map(v => v.name);
                            setProfile(p => ({ ...p, subjects: newSubjects }));
                          }}
                          placeholder="Cari atau tambah mata pelajaran..."
                          allowCreate={true}
                          icon={BookOpen}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">Tips: Pelajaran yang sudah Anda pilih tidak akan muncul kembali di hasil pencarian.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenjang Pendidikan yang Diajar</label>
                        <MultiAutocomplete
                          name="student_grades"
                          options={STUDENT_GRADES.map(g => ({ id: g, name: g }))}
                          value={profile.student_grades.map(g => ({ id: g, name: g }))}
                          onChange={(e) => {
                            const newGrades = e.target.value.map(v => v.name);
                            setProfile(p => ({ ...p, student_grades: newGrades }));
                          }}
                          placeholder="Pilih Jenjang Pendidikan..."
                          allowCreate={false}
                          icon={GraduationCap}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tarif per Jam (Rp)</label>
                        <input 
                          type="number" 
                          value={profile.hourly_rate}
                          onChange={(e) => handleInputChange('hourly_rate', parseInt(e.target.value))}
                          className={`w-full rounded-xl border ${errors.hourly_rate ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all`}
                        />
                        {errors.hourly_rate && <p className="text-[10px] font-bold text-red-500">{errors.hourly_rate}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sertifikasi & Penghargaan</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profile.certifications.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg flex items-center gap-1 ring-1 ring-emerald-100">
                            {c}
                            <button onClick={() => setProfile(p => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }))} className="hover:text-emerald-800">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Tambah sertifikasi (tekan Enter)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value) {
                            setProfile(p => ({ ...p, certifications: [...new Set([...p.certifications, e.target.value])] }));
                            e.target.value = '';
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi Pengalaman & Metode Mengajar</label>
                      <textarea 
                        value={profile.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        rows={6}
                        placeholder="Ceritakan tentang diri Anda, pengalaman mengajar, dan metode yang Anda gunakan..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>

                    <div className="pt-4">
                      <AvailabilityPicker 
                        value={profile.availability}
                        onChange={(newVal) => handleInputChange('availability', JSON.stringify(newVal))}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-10">
                    <section>
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        Kebijakan Komunikasi & Transaksi
                      </h4>
                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1 bg-amber-100 text-amber-600 rounded-lg">
                            <Shield size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-900">Keamanan Transaksi Terjamin</p>
                            <p className="text-xs text-amber-700 leading-relaxed mt-1">
                              Untuk menjamin keamanan dan kualitas layanan, semua bentuk komunikasi dan transaksi antara Guru dan Siswa <b>wajib</b> dilakukan melalui sistem resmi Tim YakinPintar.
                            </p>
                          </div>
                        </div>
                        <div className="pl-9 space-y-2">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-800">
                            <CheckCircle2 size={12} className="text-amber-500" />
                            Data kontak pribadi (WhatsApp/Email) disembunyikan secara otomatis.
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-800">
                            <CheckCircle2 size={12} className="text-amber-500" />
                            Pembayaran dilakukan melalui rekening resmi YakinPintar.
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-800">
                            <CheckCircle2 size={12} className="text-amber-500" />
                            Bantuan tim support tersedia 24/7 untuk memfasilitasi kebutuhan Anda.
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="pt-8 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Lock size={16} className="text-primary" />
                        Ganti Password
                      </h4>
                      <div className="space-y-6">
                        <div className="space-y-1.5 max-w-md">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password Saat Ini</label>
                          <input 
                            type="password" 
                            value={accountSettings.current_password}
                            onChange={(e) => handleAccountInputChange('current_password', e.target.value)}
                            placeholder="Wajib diisi jika ingin mengganti password"
                            className={`w-full rounded-xl border ${errors.current_password ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all`}
                          />
                          {errors.current_password && <p className="text-[10px] font-bold text-red-500">{errors.current_password}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password Baru</label>
                            <input 
                              type="password" 
                              value={accountSettings.new_password}
                              onChange={(e) => handleAccountInputChange('new_password', e.target.value)}
                              className={`w-full rounded-xl border ${errors.new_password ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all`}
                            />
                            {errors.new_password && <p className="text-[10px] font-bold text-red-500">{errors.new_password}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Konfirmasi Password Baru</label>
                            <input 
                              type="password" 
                              value={accountSettings.confirm_password}
                              onChange={(e) => handleAccountInputChange('confirm_password', e.target.value)}
                              className={`w-full rounded-xl border ${errors.confirm_password ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all`}
                            />
                            {errors.confirm_password && <p className="text-[10px] font-bold text-red-500">{errors.confirm_password}</p>}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">Riwayat Perubahan Profil</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menampilkan 10 Versi Terakhir</p>
                    </div>
                    
                    {versions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <History size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Belum ada riwayat perubahan</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {versions.map((v) => (
                          <div key={v.id} className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-100 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <RotateCcw size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{new Date(v.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                <p className="text-xs text-slate-500 font-medium">{v.version_note || 'Pembaruan Profil'}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRollback(v.id)}
                              className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 hover:text-primary hover:border-primary transition-all flex items-center gap-2"
                            >
                              Rollback ke Sini
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorEditProfilePage;
