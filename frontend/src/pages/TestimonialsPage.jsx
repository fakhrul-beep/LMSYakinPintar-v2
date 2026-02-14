import React from "react";
import { Star, Quote, MapPin } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Ibu Rina",
    role: "Orang Tua Murid",
    location: "Ilir Barat, Palembang",
    content: "Anak saya dari ranking 25 jadi 5 besar dalam 1 semester. Report belajar setiap sesi sangat membantu saya memantau perkembangan anak meski saya sibuk bekerja.",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=rina",
  },
  {
    id: 2,
    name: "Pak Ardi",
    role: "Orang Tua Murid",
    location: "Seberang Ulu, Palembang",
    content: "Guru yang datang sangat tepat waktu dan komunikatif. Anak saya yang tadinya benci matematika sekarang jadi lebih semangat belajar karena cara mengajarnya seru.",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=ardi",
  },
  {
    id: 3,
    name: "Siska",
    role: "Murid SMA",
    location: "Sako, Palembang",
    content: "Terima kasih YakinPintar! Berkat pendampingan intensif dari Kak Dinda, aku akhirnya lolos PTN impian lewat jalur SNBT. Materinya dijelaskan sampai paham banget.",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=siska",
  },
  {
    id: 4,
    name: "Ibu Maya",
    role: "Orang Tua Murid",
    location: "Kalidoni, Palembang",
    content: "Program mengaji di YakinPintar sangat bagus. Selain belajar tajwid, anak saya juga diajarkan adab dan doa-doa harian. Gurunya sabar sekali menghadapi anak kecil.",
    rating: 5,
    image: "https://i.pravatar.cc/150?u=maya",
  },
];

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-primary text-white py-12 mb-8">
        <div className="mx-auto max-w-6xl px-4">
          <Breadcrumbs />
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Apa Kata Mereka?
          </h1>
          <p className="mt-4 max-w-2xl text-slate-200">
            Dengarkan pengalaman langsung dari para orang tua dan murid yang telah bergabung dengan komunitas belajar YakinPintar.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="relative rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md"
            >
              <Quote className="absolute right-8 top-8 h-12 w-12 text-slate-50" />
              <div className="relative flex flex-col h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < t.rating ? "fill-accent text-accent" : "text-slate-200"}
                    />
                  ))}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-8 flex-1 italic">
                  “{t.content}”
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/10"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">{t.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{t.role}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{t.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
