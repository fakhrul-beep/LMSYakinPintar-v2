export const SUBJECTS_DATA = [
  // Preschool & TK
  {
    id: 1,
    name: "Calistung Dasar",
    level: "Preschool & TK",
    description: "Belajar membaca, menulis, dan berhitung dasar dengan metode yang menyenangkan untuk anak usia dini.",
    modules: 12,
    category: "preschool",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "Motorik & Mewarnai",
    level: "Preschool & TK",
    description: "Melatih koordinasi tangan dan mata serta kreativitas melalui aktivitas mewarnai dan kerajinan tangan.",
    modules: 8,
    category: "preschool",
    thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop"
  },
  // SD
  {
    id: 3,
    name: "Matematika SD",
    level: "SD",
    description: "Pemahaman konsep dasar matematika, operasi hitung, hingga pemecahan masalah sehari-hari.",
    modules: 24,
    category: "sd",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd48a5d5f?w=400&h=300&fit=crop"
  },
  {
    id: 4,
    name: "Bahasa Indonesia SD",
    level: "SD",
    description: "Meningkatkan kemampuan membaca, menulis, dan berbicara dengan bahasa Indonesia yang baik dan benar.",
    modules: 18,
    category: "sd",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop"
  },
  {
    id: 5,
    name: "IPA SD",
    level: "SD",
    description: "Mengenal alam sekitar, makhluk hidup, dan fenomena sains sederhana melalui pengamatan.",
    modules: 20,
    category: "sd",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop"
  },
  // SMP
  {
    id: 6,
    name: "Matematika SMP",
    level: "SMP",
    description: "Aljabar, geometri, dan statistika untuk mempersiapkan siswa menghadapi ujian sekolah dan kompetisi.",
    modules: 30,
    category: "smp",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
  },
  {
    id: 7,
    name: "Bahasa Inggris SMP",
    level: "SMP",
    description: "Grammar dasar, vocabulary, dan kemampuan percakapan sehari-hari dalam bahasa Inggris.",
    modules: 25,
    category: "smp",
    thumbnail: "https://images.unsplash.com/photo-1543165796-5426273eaec3?w=400&h=300&fit=crop"
  },
  {
    id: 8,
    name: "Fisika SMP",
    level: "SMP",
    description: "Konsep energi, gerak, dan materi dalam kehidupan sehari-hari melalui eksperimen menarik.",
    modules: 22,
    category: "smp",
    thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop"
  },
  // SMA/SMK
  {
    id: 9,
    name: "Matematika Wajib SMA",
    level: "SMA/SMK",
    description: "Persiapan intensif untuk ujian nasional dan tes masuk perguruan tinggi negeri (SNBT).",
    modules: 40,
    category: "sma",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd48a5d5f?w=400&h=300&fit=crop"
  },
  {
    id: 10,
    name: "Biologi SMA",
    level: "SMA/SMK",
    description: "Pendalaman materi genetika, sel, dan ekosistem untuk siswa jurusan IPA.",
    modules: 35,
    category: "sma",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop"
  },
  {
    id: 11,
    name: "Ekonomi SMA",
    level: "SMA/SMK",
    description: "Memahami mekanisme pasar, akuntansi dasar, dan kebijakan ekonomi makro.",
    modules: 28,
    category: "sma",
    thumbnail: "https://images.unsplash.com/photo-1611974717535-7c857a48ef0e?w=400&h=300&fit=crop"
  },
  // Mengaji & Tahsin
  {
    id: 12,
    name: "Iqra' & Juz Amma",
    level: "Mengaji & Tahsin",
    description: "Belajar membaca Al-Quran dari dasar hingga lancar membaca surat-surat pendek.",
    modules: 15,
    category: "mengaji",
    thumbnail: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop"
  },
  {
    id: 13,
    name: "Tahsin & Tajwid",
    level: "Mengaji & Tahsin",
    description: "Memperbaiki makhraj huruf dan memahami hukum bacaan Al-Quran agar lebih tartil.",
    modules: 20,
    category: "mengaji",
    thumbnail: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=300&fit=crop"
  },
  // Kursus
  {
    id: 14,
    name: "Coding Dasar (Python)",
    level: "Kursus",
    description: "Belajar logika pemrograman dasar menggunakan bahasa Python untuk pemula.",
    modules: 15,
    category: "kursus",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=300&fit=crop"
  },
  {
    id: 15,
    name: "Desain Grafis (Canva/PS)",
    level: "Kursus",
    description: "Belajar membuat konten visual yang menarik untuk media sosial dan bisnis.",
    modules: 12,
    category: "kursus",
    thumbnail: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop"
  },
  // Perguruan Tinggi
  {
    id: 16,
    name: "Kalkulus Lanjut",
    level: "Perguruan Tinggi",
    description: "Pendalaman materi turunan, integral, dan deret untuk mahasiswa teknik dan sains.",
    modules: 30,
    category: "pt",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
  },
  {
    id: 17,
    name: "Statistika Penelitian",
    level: "Perguruan Tinggi",
    description: "Belajar mengolah data penelitian menggunakan software statistik untuk skripsi/tesis.",
    modules: 20,
    category: "pt",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bbbda5462f7e?w=400&h=300&fit=crop"
  },
  // Tambahan untuk memenuhi syarat 20+ item (untuk pagination test)
  { id: 18, name: "Seni Budaya SD", level: "SD", description: "Mengenal budaya nusantara.", modules: 10, category: "sd" },
  { id: 19, name: "IPS SMP", level: "SMP", description: "Sejarah dan Geografi Indonesia.", modules: 25, category: "smp" },
  { id: 20, name: "Kimia SMA", level: "SMA/SMK", description: "Struktur atom dan reaksi kimia.", modules: 30, category: "sma" },
  { id: 21, name: "Bahasa Arab Dasar", level: "Kursus", description: "Percakapan dasar bahasa Arab.", modules: 15, category: "kursus" },
  { id: 22, name: "Manajemen Bisnis", level: "Perguruan Tinggi", description: "Dasar-dasar pengelolaan organisasi.", modules: 25, category: "pt" },
  { id: 23, name: "Robotika Anak", level: "Kursus", description: "Membangun robot sederhana.", modules: 12, category: "kursus" },
  { id: 24, name: "Bahasa Jepang Dasar", level: "Kursus", description: "Mengenal Hiragana & Katakana.", modules: 10, category: "kursus" },
  { id: 25, name: "Akuntansi Dasar", level: "SMA/SMK", description: "Jurnal umum dan buku besar.", modules: 15, category: "sma" },
];

export const CATEGORIES = [
  "Semua",
  "Preschool & TK",
  "SD",
  "SMP",
  "SMA/SMK",
  "Mengaji & Tahsin",
  "Kursus",
  "Perguruan Tinggi"
];

export const CATEGORY_COLORS = {
  "Preschool & TK": "bg-pink-100 text-pink-700 border-pink-200",
  "SD": "bg-blue-100 text-blue-700 border-blue-200",
  "SMP": "bg-green-100 text-green-700 border-green-200",
  "SMA/SMK": "bg-purple-100 text-purple-700 border-purple-200",
  "Mengaji & Tahsin": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Kursus": "bg-amber-100 text-amber-700 border-amber-200",
  "Perguruan Tinggi": "bg-indigo-100 text-indigo-700 border-indigo-200",
};
