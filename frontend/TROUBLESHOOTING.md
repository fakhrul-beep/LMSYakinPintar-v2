# Panduan Troubleshooting & Maintenance (Frontend)

Dokumen ini berisi langkah-langkah penanganan untuk masalah umum yang dilaporkan, terutama terkait kegagalan sinkronisasi skema database dan isu update frontend.

## 1. Masalah: Sinkronisasi Skema Database (Error 503)

### Gejala:
- Muncul pesan: "Sinkronisasi skema database sedang berlangsung. Silakan coba lagi dalam 5-10 detik."
- Log konsol menunjukkan `AxiosError: Request failed with status code 503`.
- Tombol simpan menunjukkan status "Sinkronisasi...".

### Root Cause:
Ini adalah perilaku standar PostgREST (Supabase) ketika terjadi perubahan struktur tabel (DDL). Sistem sedang menyegarkan cache skema internal.

### Solusi Terimplementasi:
- **Automatic Retry:** `axios.js` telah dikonfigurasi dengan *Exponential Backoff Retry* (maksimal 3 kali).
- **UI Feedback:** Muncul banner kuning dan tombol dinonaktifkan sementara.

### Langkah Manual Jika Terus Berlanjut:
1. Tunggu 10-15 detik tanpa melakukan klik berulang.
2. Jika masih gagal, lakukan **Hard Refresh** (Ctrl + F5 atau Cmd + Shift + R).
3. Periksa status database di dashboard Supabase untuk memastikan tidak ada query yang terkunci (locked).

## 2. Masalah: Perubahan Kode Tidak Muncul (Stale Frontend)

### Gejala:
- Fitur baru atau perbaikan bug tidak terlihat meskipun sudah di-deploy.
- Tampilan masih versi lama.

### Investigasi:
1. Periksa **System Info** di sidebar halaman Edit Profil.
2. Bandingkan `Versi` dan `Build` yang tertera dengan catatan rilis terbaru.

### Solusi:
- **Clear Cache:** Buka DevTools (F12) > Application > Storage > Clear site data.
- **Service Worker:** Jika menggunakan PWA, pastikan Service Worker telah di-update atau di-unregister.
- **Nginx/CDN Cache:** Pastikan server (Nginx/Cloudflare) tidak melakukan caching berlebihan pada file `index.html`.

## 3. Monitoring & Alerting

### Monitoring Terpasang:
- **Schema Sync Tracker:** Setiap kegagalan sinkronisasi yang melampaui batas retry dicatat dengan level `WARN` di log server/konsol.
- **Persistent Connection Error:** Jika terjadi 3 kegagalan koneksi dalam 5 menit, sistem akan memicu event `persistent-connection-error`.

### Rekomendasi Alerting (Opsional):
- Integrasikan dengan **Sentry** untuk menangkap `isSchemaError` yang gagal setelah retry.
- Gunakan **UptimeRobot** atau **BetterStack** untuk memantau endpoint `/api/health`.

## 4. Alur Build & Deployment

1. Pastikan `npm run build` dijalankan di lingkungan CI/CD.
2. Verifikasi bahwa file di folder `dist/` memiliki hash unik (misal: `index-B1z9X2.js`).
3. Deploy seluruh isi folder `dist/` ke web server.
