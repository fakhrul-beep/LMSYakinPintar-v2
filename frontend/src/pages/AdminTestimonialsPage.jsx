import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { 
  Search, CheckCircle, XCircle, Trash2, 
  ChevronLeft, ChevronRight, MessageSquare, 
  User, Star, Eye, EyeOff, Download, FileText
} from "lucide-react";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/testimonials?page=${page}&search=${search}`);
      setTestimonials(res.data.data.testimonials);
      setTotalPages(res.data.data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch testimonials", err);
      toast.error("Gagal memuat data testimoni");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'rejected' : 'approved';
    const loadingToast = toast.loading("Memperbarui status testimoni...");
    try {
      await api.patch(`/admin/testimonials/${id}/status`, { status: newStatus });
      toast.success(`Testimoni berhasil di-${newStatus === 'approved' ? 'tampilkan' : 'sembunyikan'}`, { id: loadingToast });
      fetchTestimonials();
    } catch (err) {
      toast.error("Gagal memperbarui status", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus testimoni ini secara permanen?")) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success("Testimoni berhasil dihapus");
      fetchTestimonials();
    } catch (err) {
      toast.error("Gagal menghapus testimoni");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = testimonials.map(t => ({
      "Nama": t.name,
      "Role": t.role || "Wali Murid",
      "Rating": t.rating || 5,
      "Isi Testimoni": t.content,
      "Status": t.status === 'approved' ? "Ditampilkan" : "Draft/Hidden",
      "Dibuat Pada": new Date(t.createdAt || t.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Testimonials");
    XLSX.writeFile(workbook, `daftar_testimoni_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daftar Testimoni LMS YakinPintar", 14, 15);
      
      const tableColumn = ["Nama", "Role", "Rating", "Status", "Tanggal"];
      const tableRows = testimonials.map(t => [
        t.name,
        t.role || "Wali Murid",
        t.rating || 5,
        t.status === 'approved' ? "Ditampilkan" : "Draft/Hidden",
        new Date(t.createdAt || t.created_at).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      doc.save(`daftar_testimoni_${new Date().toLocaleDateString()}.pdf`);
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
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Testimoni</h1>
          <p className="text-slate-500">Kelola ulasan dari orang tua dan murid untuk ditampilkan di landing page</p>
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
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau isi testimoni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500">Memuat testimoni...</div>
        ) : testimonials.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500">Belum ada testimoni.</div>
        ) : (
          testimonials.map((testi) => (
            <div key={testi.id} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {testi.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{testi.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">{testi.role || "Wali Murid"}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < (testi.rating || 5) ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic leading-relaxed">
                  "{testi.content}"
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${testi.status === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {testi.status === 'approved' ? "Ditampilkan" : "Draft/Hidden"}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(testi.id, testi.status)}
                    className={`p-2 rounded-lg transition-colors ${testi.status === 'approved' ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                    title={testi.status === 'approved' ? "Sembunyikan" : "Tampilkan"}
                  >
                    {testi.status === 'approved' ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(testi.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Permanen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <span className="text-sm text-slate-600">Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
