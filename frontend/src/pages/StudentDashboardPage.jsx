import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  User as UserIcon, 
  LogOut, 
  Bell,
  Search,
  ChevronRight,
  Clock,
  Star,
  Loader2,
  Filter,
  ArrowUpDown,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

const StudentDashboardPage = () => {
  const { user, logout, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [children, setChildren] = useState([]); // For parent multi-student view
  const [selectedStudent, setSelectedStudent] = useState(null); // Current selected student context
  const [profile, setProfile] = useState({
    name: '',
    whatsapp: '',
    grade: '',
    program: '',
    city: ''
  });
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

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
    if (activeTab === 'profile' || activeTab === 'overview') {
      fetchProfile();
    }
    if (activeTab === 'schedule' || activeTab === 'overview') {
      fetchBookings();
    }
  }, [activeTab]);

  // Auto-refresh for bookings every 30 seconds
  useEffect(() => {
    let interval;
    if (activeTab === 'schedule' || activeTab === 'overview') {
      interval = setInterval(() => {
        fetchBookings(true); // silent refresh
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Real-time status update notification listener
  useEffect(() => {
    const channel = new BroadcastChannel('booking_status_updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'STATUS_UPDATED' && event.data.studentId === user?.id) {
        toast.success(`Status booking Anda telah diperbarui menjadi: ${event.data.newStatus}`, {
          icon: '🔔',
          duration: 5000
        });
        fetchBookings(true);
      }
    };
    return () => channel.close();
  }, [user?.id]);

  const fetchBookings = async (silent = false) => {
    if (!silent) setBookingLoading(true);
    try {
      const response = await api.get('bookings/mine');
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (!silent) toast.error("Gagal mengambil jadwal les");
      setBookings([]);
    } finally {
      if (!silent) setBookingLoading(false);
    }
  };

  const filteredBookings = (bookings || [])
    .filter(b => {
      if (!b) return false;
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
      const dateStr = b.scheduled_at 
        ? new Date(b.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';
      const matchesSearch = b.tutor?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            dateStr.toLowerCase().includes(searchQuery.toLowerCase());
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
      
      if (user?.role === 'parent') {
        const allChildren = [
          ...(userData.profile?.children || []),
          ...(userData.profile?.directStudents || [])
        ];
        setChildren(allChildren);
        if (allChildren.length > 0 && !selectedStudent) {
          setSelectedStudent(allChildren[0]);
        }
      }

      setProfile({
        name: userData.name || '',
        whatsapp: userData.whatsapp || '',
        grade: userData.profile?.grade || '',
        program: userData.profile?.program || '',
        city: userData.profile?.city || ''
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal mengambil data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('users/profile', {
        name: profile.name,
        whatsapp: profile.whatsapp,
        profileData: {
          grade: profile.grade,
          program: profile.program,
          city: profile.city
        }
      });
      
      if (response.data.status === 'success') {
        toast.success("Profil berhasil diperbarui");
        // Update local auth context data if necessary
        if (updateUserData) {
          updateUserData(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'search', label: 'Cari Guru', icon: Search },
    { id: 'schedule', label: user?.role === 'parent' ? 'Jadwal Les Anak' : 'Jadwal Les Saya', icon: Calendar },
    { id: 'progress', label: 'Progress Belajar', icon: BookOpen },
    { id: 'payments', label: 'Riwayat Pembayaran', icon: CreditCard },
    { id: 'profile', label: user?.role === 'parent' ? 'Profil Akun' : 'Profil Saya', icon: UserIcon },
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
            <Link to="/" className="text-xl font-bold text-primary">YakinPintar</Link>
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
              {/* Welcome Card */}
              <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-white shadow-xl shadow-primary/20">
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-3xl font-bold">Halo, {user?.role === 'parent' ? (selectedStudent?.name || user?.name) : (user?.name)}! 👋</h2>
                  <p className="mt-2 text-primary-foreground/80">
                    {user?.role === 'parent' 
                      ? `Anda sedang melihat dashboard untuk ${selectedStudent?.name || 'anak Anda'}.` 
                      : 'Selamat datang kembali di dashboard belajar Anda. Semangat terus belajarnya ya!'}
                  </p>
                  {user?.role === 'parent' && children.length > 1 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedStudent(child)}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                            selectedStudent?.id === child.id
                              ? 'bg-white text-primary'
                              : 'bg-primary-foreground/20 text-white hover:bg-primary-foreground/30'
                          }`}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {user?.role !== 'parent' && (
                    <button className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary hover:bg-slate-50 transition-all">
                      Lihat Progres Belajar
                    </button>
                  )}
                </div>
                <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <BookOpen size={24} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Total Sesi Selesai</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {bookings.filter(b => b.status === 'completed').length} Sesi
                  </p>
                </div>
                
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                      <Clock size={24} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Booking Aktif</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {bookings.filter(b => b.status === 'confirmed').length} Sesi
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <Calendar size={24} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-500">Menunggu Konfirmasi</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {bookings.filter(b => b.status === 'requested').length} Sesi
                  </p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Upcoming Schedule */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Jadwal Mendatang</h3>
                    <button 
                      onClick={() => setActiveTab('schedule')}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="space-y-4">
                    {bookingLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : bookings.filter(b => b.status === 'confirmed' || b.status === 'requested').length > 0 ? (
                      bookings
                        .filter(b => b.status === 'confirmed' || b.status === 'requested')
                        .slice(0, 3)
                        .map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-4">
                            <div className="flex items-center gap-4">
                              <div className="rounded-lg bg-white p-2 text-primary shadow-sm">
                                <Calendar size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{item.subject}</p>
                                <p className="text-xs text-slate-500">
                                  {item.tutor?.user?.name || 'Tutor'} • {new Date(item.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">
                                {new Date(item.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {item.status === 'confirmed' ? 'Dikonfirmasi' : 'Menunggu'}
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500">Belum ada jadwal mendatang</p>
                        <button 
                          onClick={() => setActiveTab('search')}
                          className="mt-2 text-xs font-bold text-primary hover:underline"
                        >
                          Cari Tutor Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Latest Reports */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Laporan Terbaru</h3>
                    <button className="text-sm font-semibold text-primary hover:underline">Lihat Semua</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { subject: 'Matematika', date: '10 Okt 2023', summary: 'Ananda sudah mulai lancar perkalian...' },
                      { subject: 'Fisika', date: '08 Okt 2023', summary: 'Pemahaman konsep gaya sangat baik...' },
                    ].map((item, idx) => (
                      <div key={idx} className="group cursor-pointer rounded-xl border border-slate-50 p-4 transition-all hover:border-primary/20 hover:bg-primary/5">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">{item.subject}</p>
                          <ChevronRight size={16} className="text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-1">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Profil Saya</h2>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-slate-500">Memuat profil...</p>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                      <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                        {profile.name?.charAt(0) || user?.name?.charAt(0)}
                      </div>
                      <div>
                        <button type="button" className="text-sm font-bold text-primary hover:underline">Ganti Foto Profil</button>
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                        <input 
                          type="email" 
                          disabled
                          value={user?.email}
                          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        />
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kota</label>
                        <input 
                          type="text" 
                          value={profile.city}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jenjang Sekolah</label>
                        <select 
                          value={profile.grade}
                          onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        >
                          <option value="">Pilih Jenjang</option>
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA">SMA</option>
                          <option value="Alumni">Alumni/Gap Year</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Program Belajar</label>
                        <select 
                          value={profile.program}
                          onChange={(e) => setProfile({ ...profile, program: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        >
                          <option value="">Pilih Program</option>
                          <option value="Reguler">Reguler</option>
                          <option value="Intensif">Intensif</option>
                          <option value="SBMPTN">Persiapan SBMPTN/UTBK</option>
                          <option value="Olimpiade">Persiapan Olimpiade</option>
                        </select>
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

          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Jadwal Les Saya</h2>
                    <p className="text-sm text-slate-500 mt-1">Pantau status dan jadwal bimbingan belajar Anda</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Cari tutor atau mapel..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="all">Semua Status</option>
                      <option value="requested">Menunggu</option>
                      <option value="confirmed">Dikonfirmasi</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                    <button 
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all"
                    >
                      <ArrowUpDown size={16} />
                      {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                    </button>
                  </div>
                </div>

                {bookingLoading && bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-slate-500">Memuat jadwal les...</p>
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="group relative rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-slate-200/50">
                        <div className="mb-4 flex items-start justify-between">
                          <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                            booking.status === 'requested' ? 'bg-amber-100 text-amber-600' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {booking.status === 'confirmed' ? 'Dikonfirmasi' :
                             booking.status === 'requested' ? 'Menunggu Konfirmasi' :
                             booking.status === 'completed' ? 'Selesai' :
                             'Dibatalkan'}
                          </div>
                          <span className="text-xs font-bold text-slate-400">#{booking.id.slice(0, 8)}</span>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{booking.subject}</h3>
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {booking.tutor?.user?.name?.charAt(0)}
                            </div>
                            <span className="font-medium">{booking.tutor?.user?.name}</span>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-50 pt-4">
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <Calendar size={16} className="text-primary" />
                            <span>{new Date(booking.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <Clock size={16} className="text-primary" />
                            <span>{new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.duration_hours} jam)</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <MapPin size={16} className="text-primary" />
                            <span className="capitalize">{booking.mode} - {booking.area || booking.city || 'Online'}</span>
                          </div>
                        </div>

                        {booking.status === 'confirmed' && (
                          <div className="mt-6 flex gap-2">
                            <a 
                              href={`https://wa.me/${booking.tutor?.whatsapp?.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-center text-xs font-bold text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                            >
                              Hubungi Tutor
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                      <Calendar size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Tidak ada jadwal ditemukan</h3>
                    <p className="text-sm text-slate-500 mt-1">Coba ubah filter atau cari dengan kata kunci lain</p>
                    <button 
                      onClick={() => {setFilterStatus('all'); setSearchQuery('');}}
                      className="mt-4 text-sm font-bold text-primary hover:underline"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'classes' || activeTab === 'progress' || activeTab === 'payments') && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                {activeTab === 'progress' ? <BookOpen size={40} /> : <CreditCard size={40} />}
              </div>
              <h3 className="text-lg font-bold text-slate-900">Segera Hadir</h3>
              <p className="text-sm text-slate-500 mt-1">Fitur {menuItems.find(m => m.id === activeTab)?.label} sedang dalam pengembangan.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboardPage;
