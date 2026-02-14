# Laporan Migrasi Database Supabase
Tanggal: 2026-02-13
Status: Menunggu Penerapan SQL Manual oleh User

## 1. Perubahan Skema (Schema Modifications)
### Tabel `tutors`
- **Penambahan Kolom**: `profile_photo` (TEXT) ditambahkan untuk menyimpan URL foto profil guru.
- **Update RPC**: Fungsi `create_tutor_v1` diperbarui untuk mendukung parameter `p_profile_photo`.

### Tabel Baru `learning_categories`
- **Tujuan**: Menggantikan fungsi tabel `programs` sebagai kategori jenjang pembelajaran (SD, SMP, SMA, dsb).
- **Kolom**: `id`, `name` (Unique), `slug` (Unique), `description`, `is_active`, `display_order`.

### Tabel Backup `programs_legacy_backup`
- **Tujuan**: Menyimpan struktur dan data tabel `programs` asli sebelum transformasi dilakukan.

## 2. Transformasi Data (Data Transformations)
- Data unik dari kolom `name`, `slug`, `description`, dan `is_active` pada tabel `programs` lama dipindahkan secara otomatis ke tabel `learning_categories` melalui script migrasi.
- Parameter `p_program` pada RPC `create_student_v1` kini secara semantik merujuk pada nama kategori di `learning_categories`.

## 3. Hasil Verifikasi (Verification Results)
Berdasarkan pengecekan script `verify_migration.js`:
- ✅ Tabel `learning_categories` sudah tersedia.
- ✅ Tabel `programs_legacy_backup` sudah tersedia.
- ❌ Kolom `profile_photo` di tabel `tutors` **BELUM** terdeteksi (Membutuhkan eksekusi SQL manual).
- ℹ️ Data di `learning_categories` masih kosong (Menunggu migrasi data dari tabel `programs`).

## 4. Rencana Rollback (Rollback Plan)
Jika ditemukan masalah setelah migrasi, jalankan perintah SQL berikut untuk mengembalikan keadaan:

```sql
-- 1. Kembalikan data program dari backup
INSERT INTO public.programs SELECT * FROM public.programs_legacy_backup ON CONFLICT DO NOTHING;

-- 2. Hapus tabel baru jika diperlukan
DROP TABLE IF EXISTS public.learning_categories;

-- 3. Hapus kolom baru di tutors jika diperlukan
ALTER TABLE public.tutors DROP COLUMN IF EXISTS profile_photo;

-- 4. Kembalikan RPC create_tutor_v1 dan create_student_v1 ke versi asli (cek schema.sql)
```

## 5. Instruksi Final untuk User
Mohon jalankan file SQL berikut di Dashboard Supabase Anda untuk menyelesaikan proses:
1. [20240213_add_profile_photo_to_tutors.sql](file:///c:/Users/Fakhrul/Documents/trae_projects/LMSYakinPintar%20-%20v2/backend/supabase/migrations/20240213_add_profile_photo_to_tutors.sql)
2. [20240213_transform_programs_to_categories.sql](file:///c:/Users/Fakhrul/Documents/trae_projects/LMSYakinPintar%20-%20v2/backend/supabase/migrations/20240213_transform_programs_to_categories.sql)
