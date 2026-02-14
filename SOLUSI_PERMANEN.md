# Solusi Permanen: Penanganan Sinkronisasi Skema & Autentikasi

Dokumen ini menjelaskan solusi teknis untuk masalah yang ditemukan terkait kegagalan update profil guru dan error autentikasi.

## 1. Masalah: `TypeError: Cannot destructure property 'user' of 'useAuth(...)' as it is null`

### Root Cause:
`ProtectedRoute` mencoba mengakses context `AuthContext` sebelum context tersebut siap atau saat komponen berada di luar `AuthProvider`.

### Solusi Permanen:
- **Robustness di ProtectedRoute:** Menambahkan pengecekan `auth` null dan status `loading`. Jika `loading` masih true, tampilkan spinner loading alih-alih mencoba mengakses `user`.
- **Global Provider:** Memastikan `AuthProvider` membungkus seluruh `<App />` di `main.jsx`.

## 2. Masalah: `Could not find the table 'public.tutor_profile_versions' in the schema cache`

### Root Cause:
PostgREST (Supabase) memiliki cache skema yang terkadang tidak langsung diperbarui setelah tabel baru dibuat melalui migrasi SQL.

### Solusi Permanen:
- **Graceful Error Mapping (Backend):** Di `user.controller.js`, error terkait "schema cache" ditangkap dan dikembalikan sebagai status **503 (Service Unavailable)** alih-alih 500. Ini memberi tahu client bahwa ini adalah masalah sementara.
- **Smart Retry (Frontend):** Interceptor `axios.js` dikonfigurasi untuk mendeteksi error 503 atau pesan "Could not find table" dan melakukan **Exponential Backoff Retry** (maksimal 3 kali).
- **UI Feedback:** Selama retry berlangsung, UI menampilkan indikator "Sinkronisasi..." agar user tidak melakukan klik berulang yang dapat menyebabkan race condition.

## 3. Mekanisme Rollback & Integritas Data

- **Audit Logging:** Setiap perubahan profil dicatat di tabel `activity_logs`.
- **Versioning:** Sebelum update dilakukan, snapshot data lama disimpan di `tutor_profile_versions`.
- **Atomic-like Update:** Meskipun Supabase JS SDK tidak mendukung transaksi multi-tabel secara native, logika di backend memastikan backup dibuat terlebih dahulu. Jika backup gagal, update utama dibatalkan untuk mencegah hilangnya riwayat perubahan.

## 4. Langkah Verifikasi

1. Jalankan migrasi SQL di folder `supabase/migrations/`.
2. Lakukan `Hard Refresh` pada browser untuk membersihkan cache skema di sisi client.
3. Jalankan unit test: `npm test src/tests/tutor-profile-edit.test.js`.
