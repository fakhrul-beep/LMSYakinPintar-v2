import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Clock, User } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";

const BLOG_POSTS = [
  {
    id: 1,
    title: "5 Tips Ampuh Meningkatkan Konsentrasi Belajar Anak di Rumah",
    excerpt: "Menciptakan lingkungan belajar yang kondusif sangat penting untuk tumbuh kembang anak. Simak tips praktis dari pakar edukasi kami.",
    category: "Tips Belajar",
    date: "12 Feb 2026",
    author: "Admin YakinPintar",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Mengapa Les Privat Lebih Efektif Daripada Belajar Kelompok?",
    excerpt: "Pendekatan personal dalam les privat memungkinkan guru untuk fokus pada kelemahan spesifik siswa secara lebih mendalam.",
    category: "Edukasi",
    date: "10 Feb 2026",
    author: "Tim Akademik",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Persiapan Menghadapi Ujian Sekolah: Mental dan Strategi",
    excerpt: "Bukan hanya soal materi, kesiapan mental juga menjadi kunci sukses dalam menghadapi ujian. Berikut panduan lengkapnya.",
    category: "Ujian",
    date: "08 Feb 2026",
    author: "Psikolog Anak",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-primary text-white py-12 mb-8">
        <div className="mx-auto max-w-6xl px-4">
          <Breadcrumbs />
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Blog & Artikel Edukasi
          </h1>
          <p className="mt-4 max-w-2xl text-slate-200">
            Temukan berbagai tips belajar, informasi kurikulum terbaru, dan panduan parenting untuk mendukung tumbuh kembang anak.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                  {post.category}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-600 mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={14} />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User size={14} />
                      <span>{post.author}</span>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all">
                    Baca
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
