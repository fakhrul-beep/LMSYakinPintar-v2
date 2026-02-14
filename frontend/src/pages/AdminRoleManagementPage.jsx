import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { 
  Plus, Search, Edit, Trash2, Shield, Mail, 
  X, AlertCircle, CheckCircle2 
} from "lucide-react";

export default function AdminRoleManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");


  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setAdmins(res.data.data);
    } catch (_err) {
      console.error("Failed to fetch admins", _err);
      setError("Gagal mengambil data admin");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingAdmin ? "Memperbarui admin..." : "Menambah admin...");
    try {
      if (editingAdmin) {
        await api.put(`/admin/users/${editingAdmin.id}`, formData);
        toast.success("Admin berhasil diperbarui", { id: loadingToast });
      } else {
        await api.post("/admin/users", formData);
        toast.success("Admin baru berhasil ditambahkan", { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchAdmins();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menyimpan data admin", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus admin ini?")) return;
    
    const loadingToast = toast.loading("Menghapus admin...");
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Admin berhasil dihapus", { id: loadingToast });
      fetchAdmins();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menghapus admin", { id: loadingToast });
    }
  };

  const openAddModal = () => {
    setEditingAdmin(null);
    setFormData({ name: "", email: "", password: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({ name: admin.name, email: admin.email, password: "" });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Role Admin</h1>
          <p className="text-slate-500">Kelola akses dan akun administrator sistem</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent"
        >
          <Plus size={18} />
          Tambah Admin
        </button>
      </div>


      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                  Belum ada admin lain.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{admin.name}</td>
                  <td className="px-6 py-4 text-slate-600">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <Shield size={12} />
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(admin)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAdmin ? "Edit Admin" : "Tambah Admin Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary"
                  placeholder="Masukkan nama"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password {editingAdmin && "(Kosongkan jika tidak ingin diubah)"}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-accent"
                >
                  {editingAdmin ? "Simpan Perubahan" : "Tambah Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
