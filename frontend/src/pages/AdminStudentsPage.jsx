import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { 
  Plus, Search, Edit, Trash2, 
  ChevronLeft, ChevronRight, Download, FileText, 
  User, Mail, Phone, BookOpen, Filter, X
} from "lucide-react";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    parentName: "",
    whatsapp: "",
    studentName: "",
    email: "",
    grade: "",
    program: "",
    city: "",
    area: "",
    schedulePreference: "",
    isActive: true
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`admin/students?page=${page}&search=${search}`);
      setStudents(res.data.data.students);
      setTotalPages(res.data.data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch students", err);
      const errorMessage = err.response?.data?.message || "Gagal memuat data siswa";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        parentName: student.parentName || "",
        whatsapp: student.phone || student.whatsapp || "",
        studentName: student.user?.name || student.name || "",
        email: student.user?.email || student.email || "",
        grade: student.grade || "",
        program: student.program || "",
        city: student.city || "",
        area: student.area || "",
        schedulePreference: student.schedulePreference || "",
        isActive: student.isActive ?? true
      });
  } else {
    setEditingStudent(null);
    setFormData({
      parentName: "",
      whatsapp: "",
      studentName: "",
      email: "",
      grade: "",
      program: "",
      city: "",
      area: "",
      schedulePreference: "",
      isActive: true
    });
  }
  setIsModalOpen(true);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const loadingToast = toast.loading(editingStudent ? "Memperbarui data siswa..." : "Menambah siswa...");
  try {
      const dataToSend = {
        ...formData,
        name: formData.studentName, // Map for backend compatibility
        phone: formData.whatsapp,   // Map for backend compatibility
        isActive: formData.isActive
      };
    if (editingStudent) {
      await api.put(`admin/students/${editingStudent.id}`, dataToSend);
      toast.success("Data siswa berhasil diperbarui", { id: loadingToast });
    } else {
      await api.post("admin/students", dataToSend);
      toast.success("Siswa baru berhasil ditambahkan", { id: loadingToast });
    }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      if (err.response?.status === 503) {
        toast.error(
          "Sinkronisasi database sedang berlangsung. Mohon tunggu ~10 detik sebelum mencoba lagi.",
          { id: loadingToast, duration: 8000 }
        );
      } else {
        toast.error(err.response?.data?.message || "Gagal menyimpan data siswa", { id: loadingToast });
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data siswa ini?")) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success("Siswa berhasil dihapus");
      fetchStudents();
    } catch (err) {
      toast.error("Gagal menghapus siswa");
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({
      Nama: s.user?.name || s.name,
      Email: s.user?.email || s.email,
      Telepon: s.phone,
      Jenjang: s.grade,
      Program: s.program,
      Kota: s.city,
      Status: s.isActive ? "Aktif" : "Nonaktif"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
    XLSX.writeFile(wb, `daftar_siswa_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daftar Siswa YakinPintar", 14, 15);
      const tableColumn = ["Nama", "Email", "Jenjang", "Program", "Status"];
      const tableRows = students.map(s => [
        s.user?.name || s.name,
        s.user?.email || s.email,
        s.grade,
        s.program,
        s.isActive ? "Aktif" : "Nonaktif"
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
      doc.save(`daftar_siswa_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (err) {
      console.error("PDF export failed", err);
      toast.error("Gagal mengekspor PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Siswa</h1>
          <p className="text-slate-500">Kelola data murid dan progres belajar mereka</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Download size={18} /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <FileText size={18} /> PDF
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent shadow-sm">
            <Plus size={18} /> Tambah Siswa
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Nama Siswa</th>
              <th className="px-6 py-4">Jenjang & Program</th>
              <th className="px-6 py-4">Kontak</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Tidak ada data siswa ditemukan.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {(student.user?.name || student.name || "?").charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{student.user?.name || student.name}</div>
                        <div className="text-xs text-slate-500">{student.city || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{student.grade || "-"}</div>
                    <div className="text-xs text-slate-500">{student.program || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-600"><Mail size={12} /> {student.user?.email || student.email}</div>
                    <div className="flex items-center gap-1 text-slate-600 mt-1"><Phone size={12} /> {student.phone || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${student.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {student.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal(student)} className="p-1 text-slate-400 hover:text-primary transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(student.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <span className="text-sm text-slate-600">Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">{editingStudent ? "Edit Siswa" : "Tambah Siswa Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
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
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
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
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
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
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
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
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
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
                  value={formData.schedulePreference}
                  onChange={(e) => setFormData({ ...formData, schedulePreference: e.target.value })}
                  placeholder="contoh: Senin & Rabu jam 16.00–18.00"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Pengaturan Akun (Admin)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email (Sistem)
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status Siswa
                    </label>
                    <select
                      name="isActive"
                      value={formData.isActive ? "active" : "inactive"}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-accent hover:shadow-xl hover:shadow-primary/30"
                >
                  {editingStudent ? "Simpan Perubahan" : "Tambah Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
