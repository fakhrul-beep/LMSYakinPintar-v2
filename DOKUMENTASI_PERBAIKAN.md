# Dokumentasi Temuan dan Perbaikan Sistem LMS YakinPintar

Dokumen ini merangkum investigasi, temuan, dan perbaikan yang telah dilakukan pada sistem LMS YakinPintar untuk mengatasi masalah login admin, hilangnya data, dan pembaruan terminologi.

## 1. Masalah Login Admin (Error 404)

### Temuan:
- Terjadi error 404 saat melakukan login admin.
- **Penyebab Utama**: Penggunaan slash di awal path API (contoh: `/admin/login`) pada frontend yang menggunakan `baseURL` di Axios. Hal ini menyebabkan proxy Vite atau konfigurasi Axios menghasilkan URL ganda seperti `/api//admin/login`.
- **Konfigurasi Environment**: Variabel environment `VITE_API_URL` tidak terbaca dengan benar di `utils/api.js` karena fallback ke `VITE_API_BASE_URL` yang tidak ada di file `.env`.

### Perbaikan:
- Menghapus leading slash pada semua panggilan API di frontend (misal: `api.post("admin/login")` bukannya `api.post("/admin/login")`).
- Memperbaiki `frontend/src/utils/api.js` untuk mendukung `VITE_API_URL` dengan benar.
- Memperbaiki `AuthContext.jsx` untuk menggunakan path relatif.

## 2. Hilangnya Data Guru dan Program

### Temuan:
- Data guru dan program tidak muncul di dashboard admin.
- **Penyebab**: Kesalahan path API yang menyebabkan request data gagal (404), serta logika backend yang mungkin memfilter data yang tidak aktif secara default.

### Perbaikan:
- Memperbaiki endpoint di `AdminTutorsPage.jsx` dan `AdminProgramsPage.jsx`.
- Memverifikasi `admin.controller.js` di backend untuk memastikan query ke Supabase menggunakan parameter yang benar.
- Menambahkan penanganan error yang lebih baik pada fetch data di frontend.

## 3. Perubahan Terminologi & UI

### Temuan:
- Istilah "div" (divisi/kategori) dianggap membingungkan dan perlu diganti menjadi "Jenjang Pendidikan".
- Form input manual untuk jenjang pendidikan rawan kesalahan pengetikan.

### Perbaikan:
- Mengganti semua label "div", "Spesialisasi", atau "Kategori" (yang relevan dengan tutor/program) menjadi **"Jenjang Pendidikan"**.
- Mengimplementasikan **Dropdown Selection** untuk Jenjang Pendidikan menggunakan daftar standar: `Preschool/TK`, `SD`, `SMP`, `SMA/SMK`, `Umum`.
- Menghapus field "div" yang redundan pada form profil guru.
- Memperbarui `LandingPage.jsx` untuk mencerminkan perubahan terminologi ini pada bagian statistik.

## 4. Audit Supabase & Integritas Data

### Temuan:
- Koneksi ke Supabase stabil dan valid.
- Tabel-tabel utama (`users`, `tutors`, `programs`, `blogs`) dalam kondisi baik dengan relasi yang terjaga.
- RLS (Row Level Security) dikonfigurasi untuk melindungi data sensitif namun tetap mengizinkan akses admin.

### Perbaikan:
- Memastikan pemetaan data antara frontend (camelCase) dan backend/database (snake_case) konsisten menggunakan utilitas pemetaan di controller.

## 5. Daftar File yang Dimodifikasi

1. `frontend/src/utils/api.js` (BaseURL & Config)
2. `frontend/src/context/AuthContext.jsx` (Auth API Paths)
3. `frontend/src/pages/AdminLoginPage.jsx` (Login Logic)
4. `frontend/src/pages/AdminTutorsPage.jsx` (Terminologi & Dropdown)
5. `frontend/src/pages/AdminProgramsPage.jsx` (Terminologi & Dropdown)
6. `frontend/src/pages/AdminStudentsPage.jsx` (API Path Fix)
7. `frontend/src/pages/tutor/TutorEditProfilePage.jsx` (Terminologi, Dropdown & Form Clean-up)
8. `frontend/src/pages/LandingPage.jsx` (Terminology Update)
9. ... dan beberapa file admin lainnya untuk perbaikan path API.

---
**Status Sistem**: Fungsionalitas login admin telah pulih, data guru/program dapat diakses kembali, dan antarmuka telah diperbarui sesuai permintaan user.
