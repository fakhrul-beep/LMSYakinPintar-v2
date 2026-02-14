import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import { 
  Plus, Search, Edit, Trash2, X, Save,
  FolderOpen, Tag, ChevronLeft, ChevronRight
} from "lucide-react";

export default function AdminBlogCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/blog-categories");
      setCategories(res.data.data);
    } catch (_err) {
      toast.error("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name });
    } else {
      setEditingCategory(null);
      setFormData({ name: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingCategory ? "Memperbarui kategori..." : "Menambah kategori...");
    try {
      if (editingCategory) {
        await api.put(`/admin/blog-categories/${editingCategory.id}`, formData);
        toast.success("Kategori berhasil diperbarui", { id: loadingToast });
      } else {
        await api.post("/admin/blog-categories", formData);
        toast.success("Kategori berhasil ditambahkan", { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menyimpan kategori", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;
    
    const loadingToast = toast.loading("Menghapus kategori...");
    try {
      await api.delete(`/admin/blog-categories/${id}`);
      toast.success("Kategori berhasil dihapus", { id: loadingToast });
      fetchCategories();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menghapus kategori", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori Blog</h1>
          <p className="text-slate-500">Kelola kategori untuk artikel blog Anda</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent"
        >
          <Plus size={18} />
          Tambah Kategori
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Nama Kategori</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                  Memuat kategori...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                      <Tag size={14} className="text-slate-400" />
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(category)}
                        className="p-2 text-slate-400 hover:text-primary"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
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
      </div>

      {/* Modal Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Tips Belajar"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
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
                  {editingCategory ? "Simpan Perubahan" : "Tambah Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}