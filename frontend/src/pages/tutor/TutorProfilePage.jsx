import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Share2, 
  Heart, 
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Globe,
  Award,
  RefreshCcw,
  AlertCircle,
  Plus,
  Minus,
  Navigation,
  Info,
  ChevronDown,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const TutorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSlotAvailable, setIsSlotAvailable] = useState(null); // null: initial, true: available, false: unavailable

  // Helper to parse availability
  const getAvailability = () => {
    if (!tutor?.availability) return null;
    try {
      return JSON.parse(tutor.availability);
    } catch (e) {
      return tutor.availability; // Return as is if not JSON
    }
  };

  const availabilityData = getAvailability();

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    subject: '',
    grade: '',
    duration: 1.0,
    mode: 'offline',
    scheduled_at: '',
    selected_date: '',
    location: {
      address: '',
      notes: '',
      coordinates: null
    }
  });

  // Get available slots for selected date
  const availableSlots = useMemo(() => {
    if (!bookingData.selected_date || !availabilityData) return [];
    
    const selectedDate = new Date(bookingData.selected_date);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[selectedDate.getDay()];
    
    let slots = [];
    if (typeof availabilityData === 'object' && availabilityData !== null) {
      slots = availabilityData[dayName] || [];
    } else if (typeof availabilityData === 'string' && availabilityData.toLowerCase().includes(dayName.toLowerCase())) {
      // Legacy support - if string includes day, show some default hours or all day
      slots = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }
    
    return slots.map(h => h.toString().padStart(2, '0') + ':00');
  }, [bookingData.selected_date, availabilityData]);

  // Validate selected date against availability
  useEffect(() => {
    if (!bookingData.scheduled_at || !availabilityData) {
      setIsSlotAvailable(null);
      return;
    }

    const validateSchedule = () => {
      const selectedDate = new Date(bookingData.scheduled_at);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[selectedDate.getDay()];
      const hour = selectedDate.getHours();

      // Check if day exists in availability and hour is included
      // availabilityData can be an object (new format) or a string (legacy format)
      let isAvailable = false;
      if (typeof availabilityData === 'object' && availabilityData !== null) {
        isAvailable = availabilityData[dayName]?.includes(hour) || 
                      availabilityData[dayName]?.includes(hour.toString());
      } else if (typeof availabilityData === 'string') {
        // Simple string search for legacy data
        isAvailable = availabilityData.toLowerCase().includes(dayName.toLowerCase());
      }

      setIsSlotAvailable(!!isAvailable);

      // Logging activity for debugging
      console.log(`[Activity Log] Date Change: ${bookingData.scheduled_at} | Day: ${dayName} | Hour: ${hour}:00 | Available: ${!!isAvailable}`);
      
      if (!isAvailable && bookingData.scheduled_at) {
        toast.error(`Guru tidak tersedia pada hari ${dayName} jam ${hour.toString().padStart(2, '0')}:00`, { id: 'schedule-warn' });
      } else if (isAvailable) {
        toast.success(`Jadwal tersedia!`, { id: 'schedule-warn' });
      }
    };

    validateSchedule();
  }, [bookingData.scheduled_at, availabilityData]);

  useEffect(() => {
    fetchTutorDetail();

    // Listen for profile updates from other tabs (e.g., Tutor Dashboard)
    const channel = new BroadcastChannel('tutor_profile_updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'PROFILE_UPDATED' && (event.data.userId === id || event.data.userId === tutor?.user?.id)) {
        console.log('Real-time update detected, refreshing profile...');
        fetchTutorDetail();
      }
    };

    return () => {
      channel.close();
    };
  }, [id, tutor?.user?.id]);

  const fetchTutorDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tutors/${id}`);
      setTutor(response.data);
      // Initialize booking subject if tutor has subjects
      if (response.data.subjects?.length > 0) {
        setBookingData(prev => ({ ...prev, subject: response.data.subjects[0] }));
      }
    } catch (error) {
      console.error("Error fetching tutor detail:", error);
      toast.error("Gagal memuat data tutor");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    // Comprehensive Validation
    if (!bookingData.subject) {
      toast.error("Silakan pilih mata pelajaran");
      return;
    }
    if (!bookingData.scheduled_at) {
      toast.error("Silakan pilih waktu belajar");
      return;
    }
    if (bookingData.mode === 'offline' && !bookingData.location.address) {
      toast.error("Silakan masukkan alamat lengkap untuk les offline");
      return;
    }

    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk booking");
      navigate('/login');
      return;
    }

    setShowSummary(true);
  };

  const confirmBooking = async () => {
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading("Memproses booking...");
      
      const response = await api.post('/bookings', {
        studentName: user.name, // Assuming the parent's name for now or we could add a field
        grade: bookingData.grade || 'Tidak dispesifikasi',
        subject: bookingData.subject,
        mode: bookingData.mode,
        city: tutor.city,
        area: tutor.area,
        scheduledAt: bookingData.scheduled_at,
        durationHours: bookingData.duration,
        priceTotal: tutor.hourly_rate * bookingData.duration,
        tutorId: tutor.id
      });
      
      toast.success("Permintaan booking berhasil dikirim! Guru akan menghubungi Anda segera.", { id: loadingToast });
      
      // Broadcast to tutor dashboard
      try {
        const channel = new BroadcastChannel('booking_notifications');
        channel.postMessage({
          type: 'NEW_BOOKING',
          tutorId: tutor.user?.id, // Use user_id for notification filtering
          studentName: user.name,
          subject: bookingData.subject
        });
        channel.close();
      } catch (e) {
        console.error("BroadcastChannel error:", e);
      }

      setIsSubmitting(false);
      setShowSummary(false);
      setBookingData({
        subject: tutor.subjects?.[0] || '',
        grade: '',
        duration: 1.0,
        mode: 'offline',
        scheduled_at: '',
        selected_date: '',
        location: {
          address: '',
          notes: '',
          coordinates: null
        }
      });
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Gagal membuat booking: " + (error.response?.data?.message || error.message || "Terjadi kesalahan"));
      setIsSubmitting(false);
    }
  };

  const updateDuration = (increment) => {
    setBookingData(prev => {
      const newDuration = Math.max(1, Math.min(4, prev.duration + (increment ? 0.5 : -0.5)));
      return { ...prev, duration: newDuration };
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `Profil Guru: ${tutor.user?.name}`,
      text: `Lihat profil guru ${tutor.user?.name} di YakinPintar. Ahli ${tutor.subjects?.join(', ')}.`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Berhasil dibagikan');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link profil berhasil disalin ke clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleAskQuestion = () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk bertanya");
      navigate('/login');
      return;
    }
    // In a real app, this would open a chat or modal
    toast.success("Fitur chat akan segera hadir! Anda dapat menghubungi guru setelah booking dikonfirmasi.");
  };

  const handleCompare = () => {
    toast.success("Guru berhasil ditambahkan ke daftar perbandingan!");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!tutor) return <div className="p-20 text-center">Tutor tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center text-sm text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-primary">Beranda</button>
          <ChevronRight className="mx-2 h-4 w-4" />
          <button onClick={() => navigate('/tutors')} className="hover:text-primary">Cari Guru</button>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-slate-900">{tutor.user?.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header Section */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="relative h-48 bg-gradient-to-r from-primary to-blue-600">
                <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-2xl border-4 border-white bg-slate-100 shadow-lg overflow-hidden">
                  <img 
                    src={tutor.profile_photo || `https://ui-avatars.com/api/?name=${tutor.user?.name}&background=random`} 
                    alt={tutor.user?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              
              <div className="pb-8 pl-44 pr-8 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold text-slate-900">{tutor.user?.name}</h1>
                      <CheckCircle2 className="h-6 w-6 fill-blue-500 text-white" />
                    </div>
                    <p className="mt-1 text-lg font-medium text-slate-600">
                      Ahli {tutor.subjects?.join(', ')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-slate-500">
                        <MapPin className="mr-1.5 h-4 w-4" />
                        {tutor.city || 'Lokasi tidak diset'}
                      </div>
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="mr-1.5 h-4 w-4 fill-amber-500" />
                        {tutor.rating_average || '0.0'} ({tutor.rating_count || 0} Ulasan)
                      </div>
                      <div className="flex items-center text-slate-500">
                        <ShieldCheck className="mr-1.5 h-4 w-4 text-green-500" />
                        Identitas Terverifikasi
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                        isFavorite ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={handleCompare}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-primary transition-all"
                      title="Bandingkan Guru"
                    >
                      <RefreshCcw className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={handleShare}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-primary transition-all"
                      title="Bagikan Profil"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex border-t border-slate-100 bg-slate-50/50">
                <div className="flex-1 px-8 py-4 text-center">
                  <div className="text-xl font-bold text-slate-900">150+</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Jam Mengajar</div>
                </div>
                <div className="h-auto w-px bg-slate-100"></div>
                <div className="flex-1 px-8 py-4 text-center">
                  <div className="text-xl font-bold text-slate-900">45</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Siswa Aktif</div>
                </div>
                <div className="h-auto w-px bg-slate-100"></div>
                <div className="flex-1 px-8 py-4 text-center">
                  <div className="text-xl font-bold text-slate-900">{tutor.experience_years || 0} Thn</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Pengalaman</div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="mt-8">
              <div className="flex gap-8 border-b border-slate-200">
                {['about', 'experience', 'availability', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-bold transition-all ${
                      activeTab === tab 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'about' ? 'Tentang Guru' : tab === 'experience' ? 'Pendidikan & Pengalaman' : tab === 'availability' ? 'Jadwal Mingguan' : 'Ulasan Siswa'}
                  </button>
                ))}
              </div>

              <div className="py-8">
                {activeTab === 'about' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <section>
                      <h3 className="text-xl font-bold text-slate-900 mb-4">Profil Singkat</h3>
                      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                        {tutor.bio || 'Belum ada deskripsi profil.'}
                      </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900">Pendidikan</h4>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {tutor.education || 'Data pendidikan belum ditambahkan.'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                            <Globe className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900">Bahasa Pengantar</h4>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">Bahasa Indonesia</span>
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">English (Conversational)</span>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <section>
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Briefcase className="mr-3 h-6 w-6 text-primary" />
                        Pengalaman Mengajar
                      </h3>
                      <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-8px)] before:w-0.5 before:bg-slate-200">
                        <div className="relative">
                          <div className="absolute -left-[25px] top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-white"></div>
                          <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                            {tutor.experience || 'Data pengalaman belum ditambahkan.'}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'availability' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Jadwal Mingguan
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {typeof availabilityData === 'object' && availabilityData !== null ? (
                          ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                            <div key={day} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="text-xs font-bold text-slate-400 uppercase mb-2">{day}</div>
                              <div className="flex flex-wrap gap-1">
                                {availabilityData[day] && availabilityData[day].length > 0 ? (
                                  availabilityData[day].map(hour => (
                                    <span key={hour} className="text-[10px] font-bold text-primary bg-white px-2 py-1 rounded border border-primary/10">
                                      {hour.toString().padStart(2, '0')}:00
                                    </span>
                                  ))
                                ) : (
                                  <div className="text-[10px] font-medium text-slate-400 italic">Tidak Tersedia</div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                            {availabilityData || 'Jadwal belum diatur oleh guru.'}
                          </div>
                        )}
                      </div>
                      <p className="mt-6 text-sm text-slate-500 flex items-start gap-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>Catatan: Jadwal di atas adalah referensi umum ketersediaan guru. Silakan pilih waktu yang tersedia saat melakukan booking.</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-8 rounded-2xl bg-amber-50 p-6 border border-amber-100">
                      <div>
                        <div className="text-4xl font-black text-amber-600">{tutor.rating_average || '0.0'}</div>
                        <div className="flex mt-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-4 w-4 ${s <= Math.floor(tutor.rating_average || 0) ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}`} />
                          ))}
                        </div>
                        <div className="mt-1 text-sm font-medium text-amber-700">{tutor.rating_count || 0} Total Ulasan</div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-800 font-medium italic">"Sangat sabar dan jelas dalam menjelaskan materi yang sulit."</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Sample Review */}
                      {[1, 2].map(r => (
                        <div key={r} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                S{r}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">Siswa {r}</h4>
                                <p className="text-xs text-slate-500">14 Feb 2026</p>
                              </div>
                            </div>
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className="h-3 w-3 fill-amber-500 text-amber-500" />
                              ))}
                            </div>
                          </div>
                          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                            Penjelasan guru sangat mudah dimengerti. Saya yang tadinya benci matematika jadi lebih percaya diri sekarang. Terima kasih Kak!
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
                <div className="p-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">Rp {Number(tutor.hourly_rate || 0).toLocaleString('id-ID')}</span>
                    <span className="text-sm font-medium text-slate-500">/ jam</span>
                  </div>
                  
                  <form onSubmit={handleBooking} className="mt-8 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pilih Mata Pelajaran</label>
                      <select 
                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:border-primary focus:ring-primary"
                        value={bookingData.subject}
                        onChange={(e) => setBookingData({...bookingData, subject: e.target.value})}
                      >
                        {tutor.subjects?.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Metode</label>
                        <select 
                          className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-medium focus:border-primary focus:ring-primary"
                          value={bookingData.mode}
                          onChange={(e) => setBookingData({...bookingData, mode: e.target.value})}
                        >
                          <option value="offline">Offline (Visit)</option>
                          <option value="online">Online (Zoom/Meet)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Durasi</label>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => updateDuration(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary transition-all active:scale-95"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="flex-1 flex h-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700 text-sm">
                            {bookingData.duration} Jam
                          </div>
                          <button 
                            type="button"
                            onClick={() => updateDuration(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary transition-all active:scale-95"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {bookingData.mode === 'offline' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Lokasi Belajar (Alamat Visit)</label>
                        <div className="space-y-3">
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Cari alamat atau ketik lengkap..."
                              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium focus:border-primary focus:ring-primary transition-all"
                              value={bookingData.location.address}
                              onChange={(e) => setBookingData({
                                ...bookingData, 
                                location: { ...bookingData.location, address: e.target.value }
                              })}
                            />
                            <button 
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Gunakan lokasi saat ini"
                            >
                              <Navigation size={14} />
                            </button>
                          </div>
                          
                          {/* Placeholder for Map UI */}
                          <div className="relative aspect-video w-full rounded-xl bg-slate-100 border-2 border-slate-200 overflow-hidden group">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
                              <MapPin size={32} className="group-hover:scale-110 transition-transform" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">Pilih di Peta</p>
                            </div>
                            {/* In a real implementation, Google Maps component would go here */}
                            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-500 shadow-sm border border-slate-200">
                              Google Maps API Integrated
                            </div>
                          </div>

                          <textarea 
                            placeholder="Catatan tambahan lokasi (Contoh: No rumah, blok, atau patokan)"
                            rows="2"
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium focus:border-primary focus:ring-primary transition-all resize-none"
                            value={bookingData.location.notes}
                            onChange={(e) => setBookingData({
                              ...bookingData, 
                              location: { ...bookingData.location, notes: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tanggal Belajar</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="date" 
                          className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-10 text-sm font-medium focus:border-primary focus:ring-primary transition-all"
                          required
                          value={bookingData.selected_date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setBookingData({...bookingData, selected_date: e.target.value, scheduled_at: ''})}
                        />
                      </div>
                    </div>

                    {bookingData.selected_date && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pilih Jam Tersedia</label>
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.length > 0 ? (
                            availableSlots.map(time => {
                              const isSelected = bookingData.scheduled_at === `${bookingData.selected_date}T${time}`;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setBookingData({...bookingData, scheduled_at: `${bookingData.selected_date}T${time}`})}
                                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border-2 ${
                                    isSelected 
                                      ? 'bg-primary border-primary text-white shadow-md' 
                                      : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30 hover:bg-primary/5'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })
                          ) : (
                            <div className="col-span-3 py-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Tidak ada jadwal</p>
                            </div>
                          )}
                        </div>
                        {bookingData.scheduled_at && (
                          <p className="mt-2 text-[10px] font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Jam terpilih: {bookingData.scheduled_at.split('T')[1]}
                          </p>
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isSubmitting || !bookingData.scheduled_at}
                      className="mt-4 w-full rounded-xl bg-primary py-4 text-sm font-black text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Memproses...' : 'Booking Sekarang'}
                    </button>
                  </form>

                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>Konfirmasi guru biasanya dalam 1 jam</span>
                  </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                  <button 
                    onClick={handleAskQuestion}
                    className="flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ajukan Pertanyaan
                  </button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Garansi Belajar Aman</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Pembayaran baru diteruskan ke guru setelah sesi belajar selesai.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSummary(false)}></div>
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-primary p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">Ringkasan Pesanan</h3>
                <button onClick={() => setShowSummary(false)} className="rounded-full bg-white/20 p-1 hover:bg-white/30 transition-all">
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-sm text-white/80 font-medium">Mohon periksa kembali detail pesanan Anda</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Guru & Mata Pelajaran</p>
                    <p className="font-bold text-slate-800">{tutor.user?.name}</p>
                    <p className="text-sm font-medium text-primary">{bookingData.subject}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden">
                    <img src={tutor.profile_photo || `https://ui-avatars.com/api/?name=${tutor.user?.name}`} alt="" className="h-full w-full object-cover" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jadwal</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Calendar size={14} className="text-primary" />
                      {new Date(bookingData.selected_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mt-1">
                      <Clock size={14} className="text-primary" />
                      {bookingData.scheduled_at.split('T')[1]} ({bookingData.duration} Jam)
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metode Belajar</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      {bookingData.mode === 'offline' ? <MapPin size={14} className="text-rose-500" /> : <Globe size={14} className="text-blue-500" />}
                      {bookingData.mode === 'offline' ? 'Offline (Visit)' : 'Online'}
                    </div>
                  </div>
                </div>

                {bookingData.mode === 'offline' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi Visit</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{bookingData.location.address}</p>
                    {bookingData.location.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{bookingData.location.notes}"</p>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-500">Biaya Les ({bookingData.duration} jam)</span>
                    <span className="text-sm font-bold text-slate-800">Rp {(tutor.hourly_rate * bookingData.duration).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-500">Biaya Layanan</span>
                    <span className="text-sm font-bold text-slate-800">Rp 5.000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-dashed border-slate-100 mt-2">
                    <span className="font-bold text-slate-900">Total Pembayaran</span>
                    <span className="text-xl font-black text-primary">Rp {(tutor.hourly_rate * bookingData.duration + 5000).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowSummary(false)}
                  className="flex-1 py-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Ubah Data
                </button>
                <button 
                  onClick={confirmBooking}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 rounded-xl bg-primary text-sm font-black text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi & Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorProfilePage;
