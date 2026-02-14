import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, WifiOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import Breadcrumbs from "../components/Breadcrumbs";

export default function DaftarMuridPage() {
  const isOnline = useNetworkStatus();
  const { register } = useAuth();
  const [form, setForm] = useState({
    parentName: "",
    whatsapp: "",
    email: "",
    password: "",
    studentName: "",
    grade: "",
    program: "",
    city: "",
    area: "",
    schedulePreference: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Basic Client-side validation
    if (!form.whatsapp.match(/^[0-9]+$/)) {
      setError("Nomor WhatsApp hanya boleh berisi angka.");
      return;
    }
    if (form.whatsapp.length < 10) {
      setError("Nomor WhatsApp minimal 10 digit.");
      return;
    }
    if (form.password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      // Use AuthContext register
      const result = await register({
        name: form.parentName,
        email: form.email,
        password: form.password,
        whatsapp: form.whatsapp,
        grade: form.grade,
        program: form.program,
        city: form.city
      }, 'student');
      
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
      <main className="min-h-screen bg-slate-50 py-20">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pendaftaran Berhasil!</h1>
          <p className="mt-4 text-slate-600">
            Terima kasih! Akun Anda telah berhasil dibuat. Anda sekarang dapat mengakses dashboard untuk memantau perkembangan belajar.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/student"
              className="inline-block rounded-full bg-primary px-8 py-3 font-semibold text-white hover:bg-accent transition-all"
            >
              Ke Dashboard Siswa
            </Link>
            <Link
              to="/"
              className="inline-block rounded-full bg-slate-200 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-300 transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-primary text-white py-12 mb-8">
        <div className="mx-auto max-w-6xl px-4">
          <Breadcrumbs />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Daftar Les Privat
              </h1>
              <p className="mt-4 max-w-2xl text-slate-200">
                Isi formulir singkat di bawah ini dan kami akan segera mencarikan guru terbaik yang sesuai dengan kebutuhan anak Anda.
              </p>
            </div>
            {!isOnline && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-2 text-xs font-semibold text-white">
                <WifiOff size={14} />
                Mode Offline
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4">

        {error && !submitted && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Oops! Terjadi Kesalahan</p>
              <p className="mt-1 text-red-700/80">{error}</p>
            </div>
          </div>
        )}

        {!submitted && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
          >
            {/* Form content remains the same but wrapped in !submitted */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nama Orang Tua / Wali
                </label>
                <input
                  type="text"
                  name="parentName"
                  required
                  value={form.parentName}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                  placeholder="Nama Lengkap"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Alamat Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@contoh.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kata Sandi Akun
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nama Anak
                </label>
                <input
                  type="text"
                  name="studentName"
                  required
                  value={form.studentName}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                  placeholder="Nama Panggilan"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Jenjang Kelas
                </label>
                <select
                  name="grade"
                  required
                  value={form.grade}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                >
                  <option value="">Pilih jenjang</option>
                  <option value="Preschool/TK">Preschool / TK</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA/SMK">SMA / SMK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Program Les yang Diminati
              </label>
              <input
                type="text"
                name="program"
                required
                value={form.program}
                onChange={handleChange}
                placeholder="contoh: Matematika SD, Mengaji, Bahasa Inggris"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kota Domisili
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="contoh: Palembang"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Area / Kecamatan
                </label>
                <input
                  type="text"
                  name="area"
                  required
                  value={form.area}
                  onChange={handleChange}
                  placeholder="contoh: Ilir Barat, Seberang Ulu"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Preferensi Jadwal (Opsional)
              </label>
              <textarea
                name="schedulePreference"
                rows={3}
                required
                value={form.schedulePreference}
                onChange={handleChange}
                placeholder="contoh: Senin & Rabu jam 16.00–18.00"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                "Kirim Pendaftaran"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
