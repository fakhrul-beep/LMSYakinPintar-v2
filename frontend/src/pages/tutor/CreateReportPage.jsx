import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ChevronLeft, 
  Save, 
  User, 
  BookOpen, 
  Calendar, 
  Star, 
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../api/axios';

const CreateReportPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(null);
  
  const [formData, setFormData] = useState({
    summary: '',
    score: '',
    nextPlan: '',
    homework: '',
    notes: ''
  });

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/bookings/tutor`);
      const foundBooking = response.data.find(b => b.id === bookingId);
      
      if (!foundBooking) {
        toast.error("Data pertemuan tidak ditemukan");
        navigate('/tutor');
        return;
      }

      // Validation: only completed or past confirmed bookings can have reports
      const isPast = new Date(foundBooking.scheduled_at) < new Date();
      if (foundBooking.status !== 'completed' && !isPast) {
        toast.error("Laporan hanya dapat dibuat untuk pertemuan yang sudah selesai");
        navigate('/tutor');
        return;
      }

      setBooking(foundBooking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Gagal memuat data pertemuan");
      navigate('/tutor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.summary) {
      toast.error("Ringkasan pembelajaran wajib diisi");
      return;
    }

    setSaving(true);
    try {
      await api.post('/reports', {
        bookingId,
        ...formData,
        score: formData.score ? Number(formData.score) : null
      });
      toast.success("Laporan belajar berhasil disimpan");
      navigate('/tutor');
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan laporan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-slate-500 font-medium">Memuat formulir laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/tutor')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Buat Laporan Belajar</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sesi {booking?.subject}</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-accent transition-all disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Laporan
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Booking Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Info Pertemuan
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Murid</p>
                    <p className="text-sm font-bold text-slate-700">{booking?.student?.name}</p>
                    <p className="text-xs text-slate-500">{booking?.student?.grade}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</p>
                    <p className="text-sm font-bold text-slate-700">{booking?.subject}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Sesi</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(booking?.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(booking?.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({booking?.duration_hours} Jam)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <p>Laporan ini akan dapat dilihat langsung oleh orang tua murid.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    Ringkasan Pembelajaran <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Apa saja yang dipelajari hari ini? Jelaskan perkembangan materi yang telah disampaikan..."
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Star size={16} className="text-amber-500" />
                      Skor Pemahaman (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Contoh: 85"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Rencana Pertemuan Selanjutnya</label>
                  <textarea
                    rows={2}
                    placeholder="Materi apa yang akan dibahas selanjutnya?"
                    value={formData.nextPlan}
                    onChange={(e) => setFormData({ ...formData, nextPlan: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pekerjaan Rumah (PR)</label>
                  <textarea
                    rows={2}
                    placeholder="Tugas atau PR yang diberikan kepada murid..."
                    value={formData.homework}
                    onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan khusus untuk orang tua..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReportPage;
