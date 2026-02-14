# Dokumentasi Perbaikan Update Foto Profil (LMS Yakin Pintar)

## Masalah (Root Cause)
Terdapat dua masalah utama yang menyebabkan kegagalan update foto profil:

1.  **Kegagalan Update Database (404 Data Tidak Ditemukan):**
    API endpoint `/api/users/profile/photo` hanya berhasil mengunggah file ke sistem penyimpanan (folder `public/uploads`), namun tidak memperbarui kolom `profile_photo` di tabel database Supabase (`tutors` atau `students`). Hal ini menyebabkan data foto profil tidak tersinkronisasi dengan profil pengguna.

2.  **Masalah Autentikasi pada Unit Test (401 Unauthorized):**
    Unit test gagal karena adanya ketidaksinkronan `JWT_SECRET` antara lingkungan pengujian dan middleware autentikasi. Hal ini disebabkan oleh urutan pemuatan variabel lingkungan (dotenv) yang tidak konsisten pada modul ES.

## Solusi Perbaikan

### 1. Perbaikan Alur Update Database
Memperbarui route handler di `backend/src/routes/users.js` untuk secara otomatis memperbarui tabel database yang relevan setelah file berhasil diunggah.

- Menambahkan logika `async/await` pada endpoint upload.
- Mengidentifikasi peran pengguna (`role`) dari token JWT.
- Melakukan pembaruan kolom `profile_photo` pada tabel `tutors` atau `students` berdasarkan `user_id`.
- Menambahkan penanganan kesalahan (error handling) yang tepat menggunakan middleware global.

### 2. Sinkronisasi Konfigurasi Lingkungan
Dibuat modul konfigurasi terpusat di `backend/src/config/env.js` untuk memastikan semua variabel lingkungan dimuat dengan benar sebelum digunakan oleh modul lain.

- Menggunakan `dotenv.config()` di awal modul `env.js`.
- Mengekspor konstanta seperti `JWT_SECRET`, `SUPABASE_URL`, dll.
- Memperbarui `auth.middleware.js`, `auth.controller.js`, dan unit test untuk menggunakan konfigurasi terpusat ini.

### 3. Implementasi Unit Testing
Dibuat unit test komprehensif di `backend/src/tests/profile-photo.test.js` untuk memvalidasi:
- Keberhasilan upload foto profil untuk Tutor.
- Keberhasilan upload foto profil untuk Siswa.
- Penanganan error jika tidak ada file yang diunggah.
- Penanganan error jika akses tidak sah (tanpa token).

## Cara Verifikasi
Untuk memastikan perbaikan berjalan dengan benar, jalankan perintah berikut di direktori `backend`:

```bash
# Menjalankan test foto profil
npm test src/tests/profile-photo.test.js

# Menjalankan semua test terkait autentikasi dan profil
npm test
```

## Kesimpulan
Dengan perbaikan ini, alur update foto profil kini sudah terintegrasi penuh antara sistem file dan database, serta dilengkapi dengan validasi otomatis melalui unit testing untuk mencegah regresi di masa depan.
