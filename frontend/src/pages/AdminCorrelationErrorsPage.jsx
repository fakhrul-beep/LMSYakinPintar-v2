import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { 
  AlertTriangle, Clock, User, BookOpen, Layers,
  ChevronLeft, ChevronRight, RefreshCw, History
} from "lucide-react";

export default function AdminCorrelationErrorsPage() {
  const [stats, setStats] = useState({ recent_errors: 0, errors: [] });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("specializations/stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch correlation stats", err);
      toast.error("Gagal memuat statistik korelasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring Korelasi</h1>
          <p className="text-slate-500">Pantau upaya pemilihan spesialisasi yang tidak valid pada sistem pendaftaran</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Error (1 Jam Terakhir)</div>
              <div className="text-2xl font-bold text-slate-900">{stats.recent_errors}</div>
            </div>
          </div>
          {stats.recent_errors > 50 && (
            <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600 font-medium">
              Peringatan: Tingkat error tinggi terdeteksi!
            </div>
          )}
        </div>
      </div>

      {/* Errors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <History className="text-slate-400" size={18} />
            Riwayat Error Terbaru
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Mata Pelajaran ID</th>
                <th className="px-6 py-4">Spesialisasi ID</th>
                <th className="px-6 py-4">Tipe Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : stats.errors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Tidak ada log error korelasi saat ini.
                  </td>
                </tr>
              ) : (
                stats.errors.map((error) => (
                  <tr key={error.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} />
                        {new Date(error.created_at).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="font-mono text-xs">{error.user_id || "Anonymous"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-slate-400" />
                        <span className="font-mono text-xs">{error.mata_pelajaran_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-slate-400" />
                        <span className="font-mono text-xs">{error.spesialisasi_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                        {error.error_type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
