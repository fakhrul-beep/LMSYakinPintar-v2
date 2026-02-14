import React, { useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  X
} from "lucide-react";

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fullDescription: "",
    price: 0,
    category: "",
    duration: "",
    coverImage: "",
    schedule: "",
    quota: 0,
    isActive: true
  });

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/programs?page=${page}&search=${search}`);
      setPrograms(res.data.data.programs);
      setTotalPages(res.data.data.pagination.pages);
    } catch (_err) {
        console.error("Failed to fetch programs", _err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleOpenModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        description: program.description,
        fullDescription: program.fullDescription || "",
        price: program.price,
        category: program.category || "",
        duration: program.duration || "",
        coverImage: program.coverImage || "",
        schedule: program.schedule || "",
        quota: program.quota || 0,
        isActive: program.isActive
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: "",
        description: "",
        fullDescription: "",
        price: 0,
        category: "",
        duration: "",
        coverImage: "",
        schedule: "",
        quota: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingProgram ? "Memperbarui program..." : "Menambah program...");
    try {
      if (editingProgram) {
        await api.put(`/admin/programs/${editingProgram.id}`, formData);
        toast.success("Program berhasil diperbarui", { id: loadingToast });
      } else {
        // Generate slug from name
        const slug = formData.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
        await api.post("/admin/programs", { ...formData, slug });
        toast.success("Program berhasil ditambahkan", { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchPrograms();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menyimpan program", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus program ini?")) return;
    
    const loadingToast = toast.loading("Menghapus program...");
    try {
      await api.delete(`/admin/programs/${id}`);
      toast.success("Program berhasil dihapus", { id: loadingToast });
      fetchPrograms();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menghapus program", { id: loadingToast });
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
      setFormData({ ...formData, coverImage: response.data.data.url });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = programs.map(p => ({
      "Nama Program": p.name,
      "Kategori": p.category,
      "Harga": p.price,
      "Status": p.isActive ? "Aktif" : "Nonaktif",
      "Dibuat Pada": new Date(p.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Programs");
    XLSX.writeFile(workbook, `daftar_program_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daftar Program LMS YakinPintar", 14, 15);
      
      const tableColumn = ["Nama Program", "Kategori", "Harga", "Status", "Dibuat Pada"];
      const tableRows = programs.map(p => [
        p.name,
        p.category,
        `Rp ${p.price.toLocaleString()}`,
        p.isActive ? "Aktif" : "Nonaktif",
        new Date(p.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      doc.save(`daftar_program_${new Date().toLocaleDateString()}.pdf`);
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
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Program</h1>
          <p className="text-slate-500">Kelola daftar program les privat YakinPintar</p>
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
            Tambah Program
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Program Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Nama Program</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Harga</th>
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
            ) : programs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Tidak ada program ditemukan.
                </td>
              </tr>
            ) : (
              programs.map((program) => (
                <tr key={program.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{program.name}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">
                      {program.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{program.category}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    Rp {program.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {program.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        <XCircle size={12} /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(program)}
                        className="p-2 text-slate-400 hover:text-primary"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(program.id)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
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

      {/* Modal Program */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProgram ? "Edit Program" : "Tambah Program Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Nama Program</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Deskripsi Singkat</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Deskripsi Lengkap</label>
                    <div className="mt-1">
                      <ReactQuill
                        theme="snow"
                        value={formData.fullDescription}
                        onChange={(content) => setFormData({ ...formData, fullDescription: content })}
                        className="h-64 mb-12"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'image', 'code-block'],
                            ['clean']
                          ],
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kategori</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Contoh: Akademik, Mengaji"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar size={14} /> Jadwal
                    </label>
                    <input
                      type="text"
                      value={formData.schedule}
                      onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Senin - Jumat, 16:00"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Durasi</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Contoh: 90 Menit"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kuota Peserta</label>
                    <input
                      type="number"
                      value={formData.quota}
                      onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Gambar Cover</label>
                    <div className="mt-1 flex flex-col gap-2">
                      {formData.coverImage && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                          <img src={formData.coverImage} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, coverImage: "" })}
                            className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white shadow-sm hover:bg-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-4 hover:border-primary hover:bg-slate-50">
                        <div className="flex flex-col items-center justify-center pt-2">
                          {uploading ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <>
                              <ImageIcon className="mb-2 text-slate-400" size={24} />
                              <p className="text-xs text-slate-500">
                                <span className="font-semibold">Klik untuk unggah</span> atau seret file
                              </p>
                              <p className="text-[10px] text-slate-400">PNG, JPG atau WEBP (Maks. 5MB)</p>
                            </>
                          )}
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Program Aktif</label>
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
                  {editingProgram ? "Update Program" : "Simpan Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
