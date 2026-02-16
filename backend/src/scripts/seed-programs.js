import 'dotenv/config';
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

const SUBJECTS_DATA = [
  {
    name: "Calistung Dasar",
    level: "Preschool & TK",
    description: "Belajar membaca, menulis, dan berhitung dasar dengan metode yang menyenangkan untuk anak usia dini.",
    modules: 12,
    category: "preschool",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
  },
  {
    name: "Motorik & Mewarnai",
    level: "Preschool & TK",
    description: "Melatih koordinasi tangan dan mata serta kreativitas melalui aktivitas mewarnai dan kerajinan tangan.",
    modules: 8,
    category: "preschool",
    thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop"
  },
  {
    name: "Matematika SD",
    level: "SD",
    description: "Pemahaman konsep dasar matematika, operasi hitung, hingga pemecahan masalah sehari-hari.",
    modules: 24,
    category: "sd",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd48a5d5f?w=400&h=300&fit=crop"
  },
  {
    name: "Bahasa Indonesia SD",
    level: "SD",
    description: "Meningkatkan kemampuan membaca, menulis, dan berbicara dengan bahasa Indonesia yang baik dan benar.",
    modules: 18,
    category: "sd",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop"
  },
  {
    name: "IPA SD",
    level: "SD",
    description: "Mengenal alam sekitar, makhluk hidup, dan fenomena sains sederhana melalui pengamatan.",
    modules: 20,
    category: "sd",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop"
  },
  {
    name: "Matematika SMP",
    level: "SMP",
    description: "Aljabar, geometri, dan statistika untuk mempersiapkan siswa menghadapi ujian sekolah dan kompetisi.",
    modules: 30,
    category: "smp",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
  },
  {
    name: "Bahasa Inggris SMP",
    level: "SMP",
    description: "Grammar dasar, vocabulary, dan kemampuan percakapan sehari-hari dalam bahasa Inggris.",
    modules: 25,
    category: "smp",
    thumbnail: "https://images.unsplash.com/photo-1543165796-5426273eaec3?w=400&h=300&fit=crop"
  },
  {
    name: "Fisika SMP",
    level: "SMP",
    description: "Konsep energi, gerak, dan materi dalam kehidupan sehari-hari melalui eksperimen menarik.",
    modules: 22,
    category: "smp",
    thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop"
  },
  {
    name: "Matematika Wajib SMA",
    level: "SMA/SMK",
    description: "Persiapan intensif untuk ujian nasional dan tes masuk perguruan tinggi negeri (SNBT).",
    modules: 40,
    category: "sma",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd48a5d5f?w=400&h=300&fit=crop"
  },
  {
    name: "Biologi SMA",
    level: "SMA/SMK",
    description: "Pendalaman materi genetika, sel, dan ekosistem untuk siswa jurusan IPA.",
    modules: 35,
    category: "sma",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop"
  },
  {
    name: "Ekonomi SMA",
    level: "SMA/SMK",
    description: "Memahami mekanisme pasar, akuntansi dasar, dan kebijakan ekonomi makro.",
    modules: 28,
    category: "sma",
    thumbnail: "https://images.unsplash.com/photo-1611974717535-7c857a48ef0e?w=400&h=300&fit=crop"
  },
  {
    name: "Iqra' & Juz Amma",
    level: "Mengaji & Tahsin",
    description: "Belajar membaca Al-Quran dari dasar hingga lancar membaca surat-surat pendek.",
    modules: 15,
    category: "mengaji",
    thumbnail: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop"
  },
  {
    name: "Tahsin & Tajwid",
    level: "Mengaji & Tahsin",
    description: "Memperbaiki makhraj huruf dan memahami hukum bacaan Al-Quran agar lebih tartil.",
    modules: 20,
    category: "mengaji",
    thumbnail: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=300&fit=crop"
  },
  {
    name: "Coding Dasar (Python)",
    level: "Kursus",
    description: "Belajar logika pemrograman dasar menggunakan bahasa Python untuk pemula.",
    modules: 15,
    category: "kursus",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=300&fit=crop"
  },
  {
    name: "Desain Grafis (Canva/PS)",
    level: "Kursus",
    description: "Belajar membuat konten visual yang menarik untuk media sosial dan bisnis.",
    modules: 12,
    category: "kursus",
    thumbnail: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop"
  },
  {
    name: "Kalkulus Lanjut",
    level: "Perguruan Tinggi",
    description: "Pendalaman materi turunan, integral, dan deret untuk mahasiswa teknik dan sains.",
    modules: 30,
    category: "pt",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
  },
  {
    name: "Statistika Penelitian",
    level: "Perguruan Tinggi",
    description: "Belajar mengolah data penelitian menggunakan software statistik untuk skripsi/tesis.",
    modules: 20,
    category: "pt",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bbbda5462f7e?w=400&h=300&fit=crop"
  }
];

async function seedPrograms() {
  logger.info("Memulai seeding program...");

  try {
    for (const item of SUBJECTS_DATA) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const programData = {
        name: item.name,
        slug: slug,
        description: item.description,
        full_description: `${item.description}\n\nProgram ini mencakup ${item.modules} modul pembelajaran intensif.`,
        cover_image: item.thumbnail,
        duration: "8 Sesi / Bulan",
        schedule: "Fleksibel",
        price: 150000,
        quota: 10,
        category: item.level,
        is_active: true
      };

      const { data: existing, error: checkError } = await supabase
        .from("programs")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        logger.info(`Program ${item.name} sudah ada, melewati...`);
      } else {
        const { error: insertError } = await supabase
          .from("programs")
          .insert(programData);

        if (insertError) throw insertError;
        logger.info(`Program ${item.name} berhasil ditambahkan.`);
      }
    }

    logger.info("Seeding program selesai.");
    process.exit(0);
  } catch (error) {
    logger.error("Gagal melakukan seeding program:", error);
    process.exit(1);
  }
}

seedPrograms();
