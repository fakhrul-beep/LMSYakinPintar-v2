import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { 
  Search, CheckCircle, XCircle, Clock, 
  ChevronLeft, ChevronRight, Download, FileText, 
  DollarSign, User, Calendar, Filter, Eye
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/payments?page=${page}&search=${search}&status=${filterStatus}`);
      setPayments(res.data.data.payments);
      setTotalPages(res.data.data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      toast.error("Gagal memuat data pembayaran");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleUpdateStatus = async (id, status) => {
    const loadingToast = toast.loading("Memperbarui status pembayaran...");
    try {
      await api.patch(`/admin/payments/${id}/status`, { status });
      toast.success(`Pembayaran berhasil di-${status}`, { id: loadingToast });
      fetchPayments();
    } catch (err) {
      toast.error("Gagal memperbarui status", { id: loadingToast });
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(payments.map(p => ({
      ID: p.id,
      Siswa: p.student?.user?.name || p.studentName,
      Program: p.program?.name || p.programName,
      Jumlah: p.amount,
      Metode: p.method,
      Status: p.status,
      Tanggal: new Date(p.createdAt).toLocaleDateString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Pembayaran");
    XLSX.writeFile(wb, `pembayaran_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daftar Pembayaran YakinPintar", 14, 15);
      const tableColumn = ["ID", "Siswa", "Program", "Jumlah", "Metode", "Status", "Tanggal"];
      const tableRows = payments.map(p => [
        p.id?.slice(-8),
        p.student?.user?.name || p.studentName || "Siswa",
        p.program?.name || p.programName || "-",
        `Rp ${p.amount?.toLocaleString()}`,
        p.method?.toUpperCase(),
        p.status?.toUpperCase(),
        new Date(p.createdAt).toLocaleDateString()
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
      doc.save(`pembayaran_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (err) {
      console.error("PDF export failed", err);
      toast.error("Gagal mengekspor PDF");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "success": return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle size={12} /> Berhasil</span>;
      case "pending": return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700"><Clock size={12} /> Pending</span>;
      case "failed": return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"><XCircle size={12} /> Gagal</span>;
      default: return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modul Pembayaran</h1>
          <p className="text-slate-500">Pantau transaksi dan konfirmasi pembayaran siswa</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Download size={18} /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="text-xs font-bold uppercase text-slate-500">Total Transaksi</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">Rp {payments.reduce((acc, curr) => acc + (curr.status === 'success' ? curr.amount : 0), 0).toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-emerald-600 font-medium">Dari transaksi berhasil</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa atau ID transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Transaksi</th>
              <th className="px-6 py-4">Siswa & Program</th>
              <th className="px-6 py-4">Jumlah</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Tidak ada data pembayaran ditemukan.</td></tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-[10px] text-slate-500">#{payment.id?.slice(-8)}</div>
                    <div className="flex items-center gap-1 text-slate-600 text-xs mt-1"><Calendar size={12} /> {new Date(payment.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{payment.student?.user?.name || payment.studentName || "Siswa"}</div>
                    <div className="text-xs text-slate-500">{payment.program?.name || payment.programName || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">Rp {payment.amount?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{payment.method}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {payment.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(payment.id, 'success')} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition-colors">Konfirmasi</button>
                          <button onClick={() => handleUpdateStatus(payment.id, 'failed')} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">Tolak</button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-primary"
                      >
                        <Eye size={16} />
                      </button>
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

      {/* Detail Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Detail Pembayaran</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">ID Transaksi</div>
                  <div className="font-mono text-sm">#{selectedPayment.id}</div>
                </div>
                <div>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Informasi Siswa</div>
                  <div className="font-medium text-slate-900">{selectedPayment.student?.user?.name || selectedPayment.studentName}</div>
                  <div className="text-xs text-slate-500">{selectedPayment.student?.user?.email || "No email"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Program</div>
                  <div className="font-medium text-slate-900">{selectedPayment.program?.name || selectedPayment.programName || "-"}</div>
                  <div className="text-xs text-slate-500">ID: {selectedPayment.program_id?.slice(-8) || "-"}</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Metode Pembayaran</div>
                  <div className="font-bold text-slate-900 uppercase">{selectedPayment.method}</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-sm font-bold text-slate-900">Total Bayar</div>
                  <div className="text-lg font-black text-primary">Rp {selectedPayment.amount?.toLocaleString()}</div>
                </div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedPayment.id, 'success');
                      setIsModalOpen(false);
                    }}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Konfirmasi Pembayaran
                  </button>
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedPayment.id, 'failed');
                      setIsModalOpen(false);
                    }}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-sm"
                  >
                    Tolak Pembayaran
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
