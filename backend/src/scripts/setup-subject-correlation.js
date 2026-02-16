import 'dotenv/config';
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

const subjects = [
  "Matematika", "Bahasa Inggris", "Fisika", "Kimia", "Biologi",
  "Ekonomi", "Sejarah", "Geografi", "Sosiologi", "Bahasa Indonesia",
  "Komputer/TI", "Seni Budaya", "Pendidikan Agama Islam", "PJOK", "Mandarin"
];

const specializationsMap = {
  "Matematika": ["Aljabar", "Geometri", "Kalkulus", "Statistika", "Trigonometri"],
  "Bahasa Inggris": ["Grammar", "Speaking", "Writing", "Listening", "TOEFL/IELTS"],
  "Fisika": ["Mekanika", "Termodinamika", "Optik", "Listrik Magnet", "Fisika Modern"],
  "Kimia": ["Kimia Organik", "Kimia Anorganik", "Biokimia", "Kimia Fisik", "Kimia Analitik"],
  "Biologi": ["Genetika", "Ekologi", "Mikrobiologi", "Botani", "Zoologi"],
  "Ekonomi": ["Akuntansi", "Ekonomi Mikro", "Ekonomi Makro", "Manajemen", "Kewirausahaan"],
  "Sejarah": ["Sejarah Indonesia", "Sejarah Dunia", "Arkeologi", "Historiografi", "Sejarah Budaya"],
  "Geografi": ["Geografi Fisik", "Kartografi", "SIG", "Demografi", "Geografi Ekonomi"],
  "Sosiologi": ["Sosiologi Pendidikan", "Sosiologi Hukum", "Sosiologi Agama", "Sosiologi Politik", "Sosiologi Perkotaan"],
  "Bahasa Indonesia": ["Sastra", "Linguistik", "Jurnalistik", "Public Speaking", "Penulisan Kreatif"],
  "Komputer/TI": ["Programming", "Networking", "Database", "Cyber Security", "UI/UX Design"],
  "Seni Budaya": ["Seni Lukis", "Seni Musik", "Seni Tari", "Seni Teater", "Desain Grafis"],
  "Pendidikan Agama Islam": ["Fiqih", "Akidah Akhlak", "Al-Quran Hadits", "SKI", "Bahasa Arab"],
  "PJOK": ["Sepak Bola", "Basket", "Bulu Tangkis", "Atletik", "Renang"],
  "Mandarin": ["HSK 1-2", "HSK 3-4", "Business Chinese", "Conversation", "Chinese Culture"]
};

async function setupDatabase() {
  console.log("Setting up subjects and specializations tables...");

  // 1. Create tables using SQL via RPC or direct SQL if possible
  // Since we don't have a direct SQL executor, we assume tables exist or we use the client to manage data.
  // In a real scenario, we'd use migrations. Here we'll try to insert and see if it works.
  
  try {
    // We'll use a script to generate the SQL and the user can run it in Supabase SQL Editor,
    // OR we attempt to create data assuming tables exist.
    // The user requested: "Buat tabel relasi mata_pelajaran_spesialisasi"
    
    // Let's check if we can run raw SQL via a custom RPC if it exists
    // If not, we'll just seed the data into existing tables or report they need to be created.
    
    console.log("Inserting subjects...");
    const { data: subData, error: subError } = await supabase
      .from('mata_pelajaran')
      .upsert(subjects.map(name => ({ name })), { onConflict: 'name' })
      .select();

    if (subError) {
      console.error("Error creating subjects table/data. Please ensure table 'mata_pelajaran' exists with columns (id, name, created_at, updated_at).");
      console.error(subError);
      return;
    }

    console.log("Inserting specializations...");
    const allSpecs = Array.from(new Set(Object.values(specializationsMap).flat()));
    const { data: specData, error: specError } = await supabase
      .from('spesialisasi')
      .upsert(allSpecs.map(name => ({ name })), { onConflict: 'name' })
      .select();

    if (specError) {
      console.error("Error creating specializations table/data. Please ensure table 'spesialisasi' exists with columns (id, name, created_at, updated_at).");
      console.error(specError);
      return;
    }

    console.log("Mapping subjects to specializations...");
    const mapping = [];
    for (const subName of subjects) {
      const subId = subData.find(s => s.name === subName).id;
      const specs = specializationsMap[subName];
      for (const specName of specs) {
        const specId = specData.find(s => s.name === specName).id;
        mapping.push({
          mata_pelajaran_id: subId,
          spesialisasi_id: specId
        });
      }
    }

    const { error: mapError } = await supabase
      .from('mata_pelajaran_spesialisasi')
      .upsert(mapping, { onConflict: 'mata_pelajaran_id,spesialisasi_id' });

    if (mapError) {
      console.error("Error creating mapping table/data. Please ensure table 'mata_pelajaran_spesialisasi' exists.");
      console.error(mapError);
      return;
    }

    console.log("Database setup and seeding completed successfully!");

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

setupDatabase();
