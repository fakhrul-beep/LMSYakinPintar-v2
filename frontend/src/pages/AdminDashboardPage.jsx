import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-center justify-between">
      <div className={`rounded-xl p-3 ${color} bg-opacity-10`}>
        <Icon className={color.replace("bg-", "text-")} size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/dashboard/stats");
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Selamat datang kembali, admin! Berikut ringkasan performa hari ini.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Program" 
          value={stats?.programCount || 0} 
          icon={BookOpen} 
          color="bg-primary"
          trend={12}
        />
        <StatCard 
          title="Guru Aktif" 
          value={stats?.tutorCount || 0} 
          icon={Users} 
          color="bg-purple-600"
          trend={8}
        />
        <StatCard 
          title="Postingan Blog" 
          value={stats?.blogCount || 0} 
          icon={FileText} 
          color="bg-emerald-600"
          trend={-2}
        />
        <StatCard 
          title="Kunjungan Hari Ini" 
          value={stats?.visitorStats?.today || 0} 
          icon={TrendingUp} 
          color="bg-orange-600"
          trend={24}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Mockup */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Aktivitas Terbaru</h3>
          <div className="mt-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-900">
                    <span className="font-semibold">Admin</span> mengupdate program 
                    <span className="font-semibold"> "Matematika SD"</span>
                  </p>
                  <p className="text-xs text-slate-500">2 jam yang lalu</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Status Sistem</h3>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Database</span>
              <span className="font-medium text-emerald-600">Terhubung</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">API Server</span>
              <span className="font-medium text-emerald-600">Online</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Storage</span>
              <span className="font-medium text-slate-900">85% Tersedia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
