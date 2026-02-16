import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AvailabilityPicker from '../components/AvailabilityPicker';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet, 
  User as UserIcon, 
  LogOut, 
  Bell,
  Search,
  Plus,
  TrendingUp,
  Clock,
  Calendar,
  Loader2,
  Briefcase,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  MapPin,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const TutorDashboardPage = () => {
  const { user, logout, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    whatsapp: '',
    profile_photo: '',
    education: '',
    experience: '',
    subjects: [],
    student_grades: [],
    hourly_rate: 0,
    city: '',
    area: '',
    availability: ''
  });
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    // Close sidebar on tab change (mobile)
    setIsSidebarOpen(false);
    const profileTabs = ['profile', 'schedule', 'education', 'experience'];
    if (profileTabs.includes(activeTab)) {
      fetchProfile();
    }
    if (activeTab === 'students' || activeTab === 'overview') {
      fetchBookings();
      fetchReports();
    }
  }, [activeTab]);

  // Auto-refresh for bookings every 30 seconds
  useEffect(() => {
    let interval;
    if (activeTab === 'students') {
      interval = setInterval(() => {
        fetchBookings(true); // silent refresh
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Real-time booking notification listener
  useEffect(() => {
    const channel = new BroadcastChannel('booking_notifications');
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_BOOKING' && event.data.tutorId === user?.id) {
        toast.success(`Booking baru dari ${event.data.studentName}!`, {
          icon: '📅',
          duration: 5000
        });
        if (activeTab === 'students') {
          fetchBookings(true);
        }
      }
    };
    return () => channel.close();
  }, [activeTab, user?.id]);

  const fetchBookings = async (silent = false) => {
    if (!silent) setBookingLoading(true);
    try {
      const response = await api.get('bookings/tutor');
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (!silent) toast.error("Gagal mengambil daftar murid");
      setBookings([]);
    } finally {
      if (!silent) setBookingLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get('reports/tutor');
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const fetchEligibleBookings = async () => {
    setLoadingEligible(true);
    try {
      const response = await api.get('bookings/tutor/completed-for-report');
      setEligibleBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching eligible bookings:", error);
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    const toastId = toast.loading(`Mengubah status ke ${newStatus}...`);
    try {
      const response = await api.patch(`bookings/${bookingId}/status`, { status: newStatus });
      const updatedBooking = response.data;
      
      if (!updatedBooking) throw new Error("Respons server tidak valid");

      toast.success(`Booking berhasil ${newStatus}`, { id: toastId });
      fetchBookings(true);

      // Broadcast status update to student dashboard
      try {
        const channel = new BroadcastChannel('booking_status_updates');
        channel.postMessage({
          type: 'STATUS_UPDATED',
          studentId: updatedBooking.parent_id, // Student/Parent ID
          bookingId: updatedBooking.id,
          newStatus: newStatus
        });
        channel.close();
      } catch (e) {
        console.error("BroadcastChannel error:", e);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error.friendlyMessage || "Gagal mengubah status booking", { id: toastId });
    }
  };

  const filteredBookings = (bookings || [])
    .filter(b => {
      if (!b) return false;
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
      const matchesSearch = b.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = a.scheduled_at ? new Date(a.scheduled_at) : new Date(0);
      const dateB = b.scheduled_at ? new Date(b.scheduled_at) : new Date(0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('users/profile');
      const userData = response.data?.data;
      if (!userData) throw new Error("Data profil tidak ditemukan");

      setProfile({
        name: userData.name || '',
        whatsapp: userData.whatsapp || '',
        profile_photo: userData.profile?.profile_photo || '',
        education: userData.profile?.education || '',
        experience: userData.profile?.experience || '',
        subjects: userData.profile?.subjects || [],
        student_grades: userData.profile?.student_grades || [],
        hourly_rate: userData.profile?.hourly_rate || 0,
        city: userData.profile?.city || '',
        area: userData.profile?.area || '',
        availability: userData.profile?.availability || ''
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal mengambil data profil");
    } finally {
      setLoading(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Frontend validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Hanya file gambar (JPG, PNG, WEBP) yang diizinkan");
      return;
    }

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);
    const toastId = toast.loading("Mengunggah foto...");
    try {
      const response = await api.post("users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const photoUrl = response.data.data.url;
      
      // Update profile locally
      setProfile(prev => ({ ...prev, profile_photo: photoUrl }));
      
      toast.success("Foto profil berhasil diperbarui", { id: toastId });
      
      // Refresh local auth data to sync photo across the app
      if (updateUserData) {
        const profileRes = await api.get('users/profile');
        updateUserData(profileRes.data.data);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.response?.data?.message || "Gagal mengunggah foto", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Validation for availability
    if (activeTab === 'schedule') {
      try {
        const availabilityData = JSON.parse(profile.availability || '{}');
        const hasSelection = Object.values(availabilityData).some(hours => hours.length > 0);
        if (!hasSelection) {
          toast.error("Silakan pilih setidaknya satu hari dan jam ketersediaan.");
          return;
        }
      } catch (err) {
        toast.error("Format data jadwal tidak valid.");
        return;
      }
    }

    // Basic Validation
    if (!profile.name?.trim()) {
      toast.error("Nama lengkap tidak boleh kosong");
      return;
    }
    if (!profile.whatsapp?.trim()) {
      toast.error("Nomor WhatsApp tidak boleh kosong");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      console.log("Updating profile with data:", {
        name: profile.name.trim(),
        whatsapp: profile.whatsapp.trim(),
        availability: profile.availability
      });

      const response = await api.put('users/profile', {
        name: profile.name.trim(),
        whatsapp: profile.whatsapp.trim(),
        profile_photo: profile.profile_photo,
        profileData: {
          education: profile.education,
          experience: profile.experience,
          subjects: profile.subjects,
          student_grades: profile.student_grades,
          hourly_rate: profile.hourly_rate,
          city: profile.city,
          area: profile.area,
          availability: profile.availability
        }
      });
      
      if (response.data.status === 'success') {
        toast.success("Perubahan berhasil disimpan", { id: toastId });
        if (updateUserData) {
          updateUserData(response.data.data);
        }
        
        // Broadcast update to other tabs (e.g., Public Profile page)
        try {
          const channel = new BroadcastChannel('tutor_profile_updates');
          channel.postMessage({ type: 'PROFILE_UPDATED', userId: user?.id });
          channel.close();
        } catch (e) {
          console.error("BroadcastChannel error:", e);
        }

        // Refresh profile data from server to ensure sync
        fetchProfile();
      } else {
        throw new Error(response.data.message || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message || error.message || "Gagal memperbarui profil";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'schedule', label: 'Manajemen Jadwal', icon: Calendar },
    { id: 'students', label: 'Daftar Murid', icon: Users },
    { id: 'history', label: 'Histori Mengajar', icon: Clock },
    { id: 'earnings', label: 'Statistik Penghasilan', icon: TrendingUp },
    { id: 'profile', label: 'Profil Saya', icon: UserIcon },
    { id: 'education', label: 'Pendidikan', icon: FileText },
    { id: 'experience', label: 'Pengalaman', icon: Briefcase },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transition-transform duration-300 ease-in-out lg:static lg:block lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b px-6">
            <Link to="/" className="text-xl font-bold text-primary">YakinPintar Tutor</Link>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="border-t p-4">
            <button 
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b bg-white/80 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 capitalize truncate">{activeTab}</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 line-clamp-1">{user?.name}</p>
                <p className="text-xs font-medium text-slate-500 uppercase">{user?.role}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm md:text-base">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    setIsReportModalOpen(true);
                    fetchEligibleBookings();
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-accent transition-all"
                >
                  <Plus size={18} />
                  Buat Laporan Belajar
                </button>
                <button className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50 transition-all">
                  <Calendar size={18} />
                  Atur Jadwal Mengajar
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600 w-fit">
                    <Users size={24} />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Aktif Murid</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">12 Murid</p>
                </div>
                
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 w-fit">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Pendapatan Bulan Ini</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">Rp 3.450.000</p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-600 w-fit">
                    <Clock size={24} />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Total Jam Mengajar</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">148 Jam</p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600 w-fit">
                    <FileText size={24} />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Laporan Menunggu</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">3 Laporan</p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Active Students */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Murid Aktif</h3>
                    <button className="text-sm font-semibold text-primary hover:underline">Lihat Semua</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Ahmad Faisal', grade: 'Kelas 5 SD', subject: 'Matematika', progress: 85 },
                      { name: 'Siti Aminah', grade: 'Kelas 8 SMP', subject: 'Bahasa Inggris', progress: 70 },
                      { name: 'Budi Santoso', grade: 'Kelas 12 SMA', subject: 'Fisika', progress: 92 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-3 rounded-xl border border-slate-50 bg-slate-50/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.grade} • {item.subject}</p>
                          </div>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{item.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${item.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Aktivitas Terbaru</h3>
                  </div>
                  <div className="space-y-6">
                    {[
                      { type: 'payment', title: 'Pembayaran Diterima', desc: 'Sesi Matematika - Ahmad Faisal', time: '2 jam yang lalu' },
                      { type: 'report', title: 'Laporan Terkirim', desc: 'Laporan Belajar - Siti Aminah', time: '5 jam yang lalu' },
                      { type: 'booking', title: 'Jadwal Baru', desc: 'Budi Santoso - Fisika', time: 'Kemarin' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          item.type === 'payment' ? 'bg-emerald-500' : 
                          item.type === 'report' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-600">{item.desc}</p>
                          <p className="mt-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Profil Guru</h2>
                  <Link 
                    to="/tutor/profile/edit"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-accent transition-all"
                  >
                    <UserIcon size={18} />
                    Edit Profil Lengkap
                  </Link>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-slate-500">Memuat profil...</p>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                      <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                        {profile.profile_photo ? (
                          <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />
                        ) : (
                          profile.name?.charAt(0) || user?.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer inline-block">
                          <span className={`text-sm font-bold text-primary hover:underline ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {uploading ? 'Mengunggah...' : 'Ganti Foto Profil'}
                          </span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploading}
                          />
                        </label>
                        <p className="text-xs text-slate-500 mt-1">Format JPG, PNG maksimal 2MB</p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mata Pelajaran yang Diampu</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {profile.subjects.map((sub, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                              {sub}
                              <button type="button" onClick={() => setProfile({...profile, subjects: profile.subjects.filter((_, i) => i !== idx)})} className="hover:text-red-500">
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Tambah mata pelajaran..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val && !profile.subjects.includes(val)) {
                                  setProfile({ ...profile, subjects: [...profile.subjects, val] });
                                  e.target.value = '';
                                }
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor WhatsApp</label>
                        <input 
                          type="tel" 
                          value={profile.whatsapp}
                          onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kota Domisili</label>
                        <input 
                          type="text" 
                          value={profile.city}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tarif per Jam (Rp)</label>
                        <input 
                          type="number" 
                          value={profile.hourly_rate}
                          onChange={(e) => setProfile({ ...profile, hourly_rate: parseInt(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-accent hover:shadow-xl transition-all disabled:opacity-70"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Pendidikan</h2>
                  <Link 
                    to="/tutor/profile/edit"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-accent transition-all"
                  >
                    <UserIcon size={18} />
                    Edit Detail
                  </Link>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendidikan Terakhir</label>
                      <input 
                        type="text" 
                        value={profile.education}
                        onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                        placeholder="Contoh: S1 Pendidikan Matematika - UI"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-accent transition-all disabled:opacity-70"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Pengalaman</h2>
                  <Link 
                    to="/tutor/profile/edit"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-accent transition-all"
                  >
                    <UserIcon size={18} />
                    Edit Detail
                  </Link>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pengalaman Mengajar</label>
                      <textarea 
                        value={profile.experience}
                        onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                        rows={8}
                        placeholder="Ceritakan pengalaman mengajar Anda secara detail..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-accent transition-all disabled:opacity-70"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Manajemen Jadwal</h2>
                  <Link 
                    to="/tutor/profile/edit"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-accent transition-all"
                  >
                    <UserIcon size={18} />
                    Atur Ketersediaan
                  </Link>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <AvailabilityPicker 
                      value={profile.availability}
                      onChange={(newVal) => setProfile({ ...profile, availability: JSON.stringify(newVal) })}
                    />
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-accent transition-all disabled:opacity-70"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Daftar Murid & Booking</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola permintaan booking dan daftar murid Anda</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Cari murid atau mapel..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <button 
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all"
                    >
                      <ArrowUpDown size={16} />
                      {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'requested', label: 'Menunggu' },
                    { id: 'confirmed', label: 'Dikonfirmasi' },
                    { id: 'completed', label: 'Selesai' },
                    { id: 'cancelled', label: 'Dibatalkan' }
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => setFilterStatus(status.id)}
                      className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                        filterStatus === status.id 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>

                {bookingLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-slate-500 font-medium">Memuat data booking...</p>
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="group relative rounded-2xl border border-slate-100 bg-white p-6 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Student Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                                  {booking.student?.name?.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">{booking.student?.name}</h4>
                                  <p className="text-sm text-slate-500">{booking.student?.grade} • {booking.subject}</p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                                booking.status === 'requested' ? 'bg-amber-100 text-amber-600' :
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {booking.status === 'requested' ? 'Menunggu' : 
                                 booking.status === 'confirmed' ? 'Aktif' :
                                 booking.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-slate-50">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar size={16} className="text-slate-400" />
                                <span className="text-xs font-medium">
                                  {new Date(booking.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={16} className="text-slate-400" />
                                <span className="text-xs font-medium">
                                  {new Date(booking.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({booking.duration_hours} Jam)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <MapPin size={16} className="text-slate-400" />
                                <span className="text-xs font-medium">{booking.mode === 'online' ? 'Online' : booking.area || booking.city}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-xs">
                                  <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Orang Tua</p>
                                  <p className="text-slate-700 font-bold">{booking.parent?.name}</p>
                                </div>
                                <div className="text-xs">
                                  <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Total Biaya</p>
                                  <p className="text-primary font-bold">Rp {booking.price_total?.toLocaleString('id-ID')}</p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {booking.status === 'requested' && (
                                  <>
                                    <button 
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-accent transition-all"
                                    >
                                      <CheckCircle size={14} /> Terima
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-all"
                                    >
                                      <XCircle size={14} /> Tolak
                                    </button>
                                  </>
                                )}
                                {booking.status === 'confirmed' && (
                                  <button 
                                    onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all"
                                  >
                                    <CheckCircle size={14} /> Tandai Selesai
                                  </button>
                                )}
                                {booking.status === 'completed' && !reports.some(r => r.booking_id === booking.id) && (
                                  <Link
                                    to={`/tutor/reports/create/${booking.id}`}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-accent transition-all"
                                  >
                                    <Plus size={14} /> Buat Laporan Perkembangan
                                  </Link>
                                )}
                                {booking.status === 'completed' && reports.some(r => r.booking_id === booking.id) && (
                                  <span className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold">
                                    <CheckCircle size={14} /> Laporan Terkirim
                                  </span>
                                )}
                                <a 
                                  href={`https://wa.me/${booking.parent?.whatsapp?.replace(/^0/, '62')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                                >
                                  Hubungi Orang Tua
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                      <Users size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Tidak ada booking</h3>
                    <p className="mt-2 text-slate-500 max-w-sm">
                      Belum ada permintaan booking yang sesuai dengan kriteria pencarian Anda.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Histori Mengajar</h3>
              <p className="mt-2 text-slate-500 max-w-sm">
                Fitur riwayat sesi belajar Anda akan segera hadir di sini.
              </p>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Statistik Penghasilan</h3>
              <p className="mt-2 text-slate-500 max-w-sm">
                Pantau pendapatan dan statistik mengajar Anda di sini.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Report Selection Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pilih Jadwal Selesai</h3>
                <p className="text-sm text-slate-500">Pilih sesi mengajar yang ingin dibuatkan laporan</p>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {loadingEligible ? (
                 <div className="flex flex-col items-center justify-center py-12">
                   <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-sm text-slate-500 font-medium">Memuat data...</p>
                 </div>
               ) : eligibleBookings.length > 0 ? (
                 eligibleBookings.map(booking => (
                     <div key={booking.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-primary/20 hover:bg-white transition-all flex items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                           {booking.student?.name?.charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-slate-900 text-sm">{booking.student?.name}</p>
                           <p className="text-xs text-slate-500">{booking.subject} • {new Date(booking.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                         </div>
                       </div>
                       <Link
                         to={`/tutor/reports/create/${booking.id}`}
                         onClick={() => setIsReportModalOpen(false)}
                         className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-accent transition-all"
                       >
                         Pilih
                       </Link>
                     </div>
                   ))
               ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <FileText size={32} />
                  </div>
                  <p className="font-bold text-slate-900">Tidak ada jadwal yang tersedia</p>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                    Semua jadwal mengajar yang sudah selesai telah dibuatkan laporan belajarnya.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorDashboardPage;
