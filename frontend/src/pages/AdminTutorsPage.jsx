import React, { useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { 
  Plus, Search, Edit, Trash2, CheckCircle, XCircle, X,
  ChevronLeft, ChevronRight, User, Mail, Phone, GraduationCap, Download, Camera,
  FileText
} from "lucide-react";

export default function AdminTutorsPage() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    education: "",
    experience: "",
    hourlyRate: 0,
    city: "",
    area: "",
    profilePhoto: "",
    isActive: true,
  });

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tutors?page=${page}&search=${search}`);
      setTutors(res.data.data.tutors);
      setTotalPages(res.data.data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch tutors", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);



  const handleOpenModal = (tutor = null) => {
    if (tutor) {
      setEditingTutor(tutor);
      setFormData({
        name: tutor.user?.name || "",
        email: tutor.user?.email || "",
        phone: tutor.phone || "",
        specialization: tutor.specialization || "",
        profilePhoto: tutor.profilePhoto || "",
        education: tutor.education || "",
        experience: tutor.experience || "",
        hourlyRate: tutor.hourlyRate || 0,
        city: tutor.city || "",
        area: tutor.area || "",
        isActive: tutor.isActive
      });
    } else {
      setEditingTutor(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        specialization: "",
        profilePhoto: "",
        education: "",
        experience: "",
        hourlyRate: 0,
        city: "",
        area: "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingTutor ? "Memperbarui data guru..." : "Menambah guru baru...");
    try {
      if (editingTutor) {
        await api.put(`/admin/tutors/${editingTutor.id}`, formData);
        toast.success("Data guru berhasil diperbarui", { id: loadingToast });
      } else {
        await api.post("/admin/tutors", formData);
        toast.success("Guru baru berhasil ditambahkan", { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchTutors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data guru", { id: loadingToast });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const loadingToast = toast.loading("Memperbarui status...");
    try {
      await api.patch(`/admin/tutors/${id}/status`, { isActive: !currentStatus });
      toast.success(`Akun guru ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`, { id: loadingToast });
      fetchTutors();
    } catch (_err) {
      console.error("Failed to toggle status", _err);
      toast.error("Gagal memperbarui status", { id: loadingToast });
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    setUploading(true);
    try {
      const response = await api.post("/admin/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, profilePhoto: response.data.data.url });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = tutors.map(t => ({
      "Nama": t.user?.name,
      "Email": t.user?.email,
      "Telepon": t.phone || "-",
      "Spesialisasi": t.specialization || "-",
      "Status": t.isActive ? "Aktif" : "Nonaktif",
      "Daftar Pada": new Date(t.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tutors");
    XLSX.writeFile(workbook, `daftar_guru_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daftar Guru LMS YakinPintar", 14, 15);
      
      const tableColumn = ["Nama", "Email", "Telepon", "Spesialisasi", "Status", "Daftar Pada"];
      const tableRows = tutors.map(t => [
        t.user?.name,
        t.user?.email,
        t.phone || "-",
        t.specialization || "-",
        t.isActive ? "Aktif" : "Nonaktif",
        new Date(t.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      doc.save(`daftar_guru_${new Date().toLocaleDateString()}.pdf`);
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
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Guru</h1>
          <p className="text-slate-500">Kelola data pengajar dan status keaktifan</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Download size={18} />
            Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <FileText size={18} />
            PDF
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent shadow-sm"
          >
            <Plus size={18} />
            Tambah Guru
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Tutors Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Nama Guru</th>
              <th className="px-6 py-4">Spesialisasi</th>
              <th className="px-6 py-4">Kontak</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : tutors.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Tidak ada data guru ditemukan.
                </td>
              </tr>
            ) : (
              tutors.map((tutor) => (
                <tr key={tutor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        {tutor.profilePhoto ? (
                          <img src={tutor.profilePhoto} alt={tutor.user?.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold">
                            {tutor.user?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{tutor.user?.name}</div>
                        <div className="text-xs text-slate-500">{tutor.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {tutor.specialization || "Belum diatur"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1"><Phone size={12} /> {tutor.phone || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(tutor.id, tutor.isActive)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        tutor.isActive 
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tutor.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {tutor.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(tutor)}
                        className="p-2 text-slate-400 hover:text-primary"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-sm text-slate-500">
            Menampilkan halaman {page} dari {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tutor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTutor ? "Edit Data Guru" : "Tambah Guru Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                      <input
                        type="email"
                        required
                        disabled={!!editingTutor}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Nomor Telepon</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <GraduationCap size={14} /> Spesialisasi
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Contoh: Matematika, Bahasa Arab"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Harga per Jam (Rp)</label>
                      <input
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Kota</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Area/Kecamatan</label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Riwayat Pendidikan</label>
                    <div className="mt-1">
                      <ReactQuill
                        theme="snow"
                        value={formData.education}
                        onChange={(content) => setFormData({ ...formData, education: content })}
                        className="h-48 mb-12"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Pengalaman</label>
                    <div className="mt-1">
                      <ReactQuill
                        theme="snow"
                        value={formData.experience}
                        onChange={(content) => setFormData({ ...formData, experience: content })}
                        className="h-48 mb-12"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Foto Profil</label>
                    <div className="mt-1 flex flex-col gap-2">
                      {formData.profilePhoto ? (
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                          <img src={formData.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, profilePhoto: "" })}
                            className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white shadow-sm hover:bg-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300">
                          <User size={64} />
                        </div>
                      )}
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-slate-200 py-3 hover:border-primary hover:bg-slate-50">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          {uploading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <Camera size={16} />
                          )}
                          <span>Unggah Foto</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="tutorActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="tutorActive" className="text-sm font-medium text-slate-700">Akun Aktif</label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
                >
                  {editingTutor ? "Update Guru" : "Simpan Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}