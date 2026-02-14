import React, { useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../utils/api";
import { 
  Plus, Search, Edit, Trash2, Eye, 
  ChevronLeft, ChevronRight, XCircle, FileText, Image as ImageIcon, Tag, Download, X, CheckCircle
} from "lucide-react";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    status: "draft",
    publishedAt: "",
    featuredImage: ""
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/blog?page=${page}&search=${search}`);
      setPosts(res.data.data.posts);
      setTotalPages(res.data.data.pagination.pages);
    } catch (_err) {
        console.error("Failed to fetch posts", _err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/admin/blog-categories");
      setCategories(res.data.data);
    } catch (_err) {
      console.error("Failed to fetch categories", _err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  const handleOpenModal = (post = null) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        category: post.category || "",
        tags: post.tags?.join(", ") || "",
        featuredImage: post.featuredImage || "",
        status: post.status,
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : ""
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        category: "",
        tags: "",
        featuredImage: "",
        status: "draft",
        publishedAt: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingPost ? "Memperbarui artikel..." : "Menerbitkan artikel...");
    try {
      const formattedData = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== ""),
      };

      if (editingPost) {
        await api.put(`/admin/blog/${editingPost.id}`, formattedData);
        toast.success("Artikel berhasil diperbarui", { id: loadingToast });
      } else {
        await api.post("/admin/blog", formattedData);
        toast.success("Artikel berhasil diterbitkan", { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (_err) {
      toast.error(_err.response?.data?.message || "Gagal menyimpan artikel", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus artikel ini?")) return;
    
    const loadingToast = toast.loading("Menghapus artikel...");
    try {
      await api.delete(`/admin/blog/${id}`);
      toast.success("Artikel berhasil dihapus", { id: loadingToast });
      fetchPosts();
    } catch (_err) {
        toast.error(_err.response?.data?.message || "Gagal menghapus blog", { id: loadingToast });
    }
  };

  const handleExportExcel = () => {
    const dataToExport = posts.map(p => ({
      "Judul": p.title,
      "Penulis": p.author?.name || "-",
      "Kategori": p.category,
      "Status": p.status,
      "Views": p.views,
      "Dibuat Pada": new Date(p.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Blog Posts");
    XLSX.writeFile(workbook, `daftar_blog_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Daftar Postingan Blog LMS YakinPintar", 14, 15);
      
      const tableColumn = ["Judul", "Penulis", "Kategori", "Status", "Views", "Dibuat Pada"];
      const tableRows = posts.map(p => [
        p.title,
        p.author?.name || "-",
        p.category,
        p.status,
        p.views.toString(),
        new Date(p.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      doc.save(`daftar_blog_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (err) {
      console.error("PDF export failed", err);
      toast.error("Gagal mengekspor PDF");
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e, type = "featured") => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    setUploading(true);
    try {
      const response = await api.post("/admin/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (type === "featured") {
        setFormData({ ...formData, featuredImage: response.data.data.url });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Blog</h1>
          <p className="text-slate-500">Tulis dan kelola artikel edukasi YakinPintar</p>
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
            Tulis Artikel
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Blog Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Judul Artikel</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Tanggal</th>
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
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Tidak ada artikel ditemukan.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{post.title}</div>
                    <div className="text-xs text-slate-500">Oleh {post.author?.name || "Admin"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {post.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      post.status === "published" 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-amber-50 text-amber-700"
                    }`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(post.createdAt || post.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(post)}
                        className="p-2 text-slate-400 hover:text-primary"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
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

      {/* Modal Blog Post */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPost ? "Edit Artikel" : "Tulis Artikel Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Judul Artikel</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Masukkan judul artikel yang menarik..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Konten Artikel</label>
                    <div className="mt-1">
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        className="h-80 mb-12"
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
                    <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {formData.status === "scheduled" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Waktu Publikasi</label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.publishedAt}
                        onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tags (Pisahkan dengan koma)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Contoh: uan, matematika, tips"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Gambar Unggulan</label>
                    <div className="mt-1 flex flex-col gap-2">
                      {formData.featuredImage && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                          <img src={formData.featuredImage} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, featuredImage: "" })}
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
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Ringkasan (Excerpt)</label>
                    <textarea
                      rows={4}
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Ringkasan singkat untuk tampilan kartu..."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Eye size={18} />
                  Preview
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-accent"
                >
                  {editingPost ? "Update Artikel" : "Terbitkan Artikel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Preview Artikel</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex items-center gap-2">
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 uppercase">
                    {formData.category || "Uncategorized"}
                  </span>
                  <span className="text-sm text-slate-400">•</span>
                  <span className="text-sm text-slate-400">{new Date().toLocaleDateString()}</span>
                </div>
                <h1 className="mb-8 text-4xl font-extrabold text-slate-900 leading-tight">
                  {formData.title || "Judul Artikel Anda"}
                </h1>
                {formData.featuredImage && (
                  <img 
                    src={formData.featuredImage} 
                    alt="Featured" 
                    className="mb-8 w-full rounded-2xl object-cover aspect-video shadow-lg"
                  />
                )}
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formData.content || "<p>Belum ada konten...</p>" }}
                />
                {formData.tags && (
                  <div className="mt-12 flex flex-wrap gap-2 border-t pt-8">
                    {formData.tags.split(",").map((tag, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}