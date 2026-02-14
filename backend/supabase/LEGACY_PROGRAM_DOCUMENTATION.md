# Dokumentasi Backup: Fitur Program (Legacy)
Tanggal: 2026-02-13
Status: Sebelum Perubahan Menjadi Kategori Pembelajaran

## 1. Struktur Database (PostgreSQL/Supabase)
Tabel `public.programs` menyimpan informasi mendetail tentang paket les yang ditawarkan.

### Skema Tabel `programs`:
- `id`: UUID (Primary Key)
- `name`: TEXT (Nama Program, e.g., "SD - Kelas 1-6")
- `slug`: TEXT (Unique, URL friendly)
- `description`: TEXT (Ringkasan singkat)
- `full_description`: TEXT (Detail program lengkap)
- `cover_image`: TEXT (URL gambar sampul)
- `duration`: TEXT (Durasi belajar, e.g., "90 Menit")
- `schedule`: TEXT (Jadwal, e.g., "Fleksibel")
- `price`: NUMERIC (Harga paket)
- `quota`: INTEGER (Kuota siswa)
- `category`: TEXT (Pengelompokan, e.g., "Reguler")
- `is_active`: BOOLEAN (Status aktif/nonaktif)
- `created_at` / `updated_at`: TIMESTAMP

### Relasi:
- `public.students.program`: Menyimpan referensi (TEXT) ke nama program yang diambil oleh siswa.
- `public.create_student_v1`: Fungsi RPC yang menerima parameter `p_program` saat registrasi siswa.

## 2. Struktur Model (Mongoose)
File: `backend/src/models/program.model.js`
- Mengikuti skema yang sama dengan PostgreSQL untuk sinkronisasi data.
- Memiliki index pada `slug`, `category`, dan pencarian teks pada `name`.

## 3. Logika Bisnis & Menu
- **Admin Management**: CRUD lengkap di `AdminProgramsPage.jsx`.
- **Registrasi Siswa**: Siswa memilih program saat mendaftar (disimpan di tabel `students`).
- **Export Data**: Fitur ekspor ke Excel dan PDF di dashboard admin.

## 4. Dependensi Terkait
- **Controllers**: `admin.controller.js` (Fungsi CRUD program).
- **Routes**: `routes/admin.js` (Endpoint `/programs`).
- **Frontend**: `AdminProgramsPage.jsx` (UI manajemen).
