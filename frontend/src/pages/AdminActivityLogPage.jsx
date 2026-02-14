import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { 
  History, User, Activity, Clock, 
  ChevronLeft, ChevronRight, Search, Filter 
} from "lucide-react";

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/logs?page=${page}`);
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pagination.pages);
      } catch (err) {
        console.error("Failed to fetch activity logs", err);
        toast.error("Gagal memuat log aktivitas");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const getActionColor = (action) => {
    if (action.includes("CREATE")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (action.includes("UPDATE")) return "text-accent bg-yellow-50 border-yellow-100";
    if (action.includes("DELETE")) return "text-red-600 bg-red-50 border-red-100";
    return "text-slate-600 bg-slate-50 border-slate-100";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Log Aktivitas</h1>
        <p className="text-slate-500">Pantau semua perubahan data yang dilakukan oleh tim admin</p>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Aksi</th>
              <th className="px-6 py-4">Entitas</th>
              <th className="px-6 py-4">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Memuat log...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Belum ada riwayat aktivitas.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={14} />
                      {new Date(log.createdAt || log.created_at).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                        {log.user?.name?.charAt(0) || "A"}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{log.user?.name}</div>
                        <div className="text-[10px] text-slate-500">{log.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Activity size={14} className="text-slate-400" />
                      {log.entity}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-xs text-slate-500" title={JSON.stringify(log.details)}>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
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
            Halaman {page} dari {totalPages}
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
    </div>
  );
}