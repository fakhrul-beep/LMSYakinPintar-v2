# Style Guide - LMS Yakin Pintar (v2)

Dokumentasi ini berisi panduan desain dan teknis untuk menjaga konsistensi UI/UX di seluruh platform LMS Yakin Pintar.

## **Sistem Warna**

Kami menggunakan palet warna yang modern dan berani untuk meningkatkan keterlibatan pengguna.

| Nama | Hex Code | Penggunaan Utama |
| :--- | :--- | :--- |
| **Primary** | `#2E5BFF` | Tombol Utama, Link Aktif, Brand Identity |
| **Secondary** | `#1E293B` | Teks Utama, Latar Belakang Gelap |
| **Accent** | `#FCB900` | Highlight, Badge, Hover State (Tombol) |
| **Neon** | `#39FF14` | Aksen Modern, Gamification |
| **Coral** | `#FF7F50` | Aksen Hangat, Warning Ringan |
| **Success** | `#10B981` | Status Berhasil, Notifikasi Positif |
| **Error** | `#EF4444` | Pesan Kesalahan, Status Gagal |

---

## **Tipografi**

- **Font Family**: `Poppins` (Sans-serif)
- **Base Size**: `16px` (1rem)

### **Hirarki Visual**
- **H1**: `text-5xl` (48px) Desktop / `text-4xl` (36px) Mobile
- **H2**: `text-3xl` (30px)
- **H3**: `text-2xl` (24px)
- **Body**: `text-base` (16px)
- **Small**: `text-sm` (14px)

---

## **Spacing & Layout**

Kami mengikuti skala spacing berbasis `4px` untuk konsistensi.

- **Padding Kontainer**: `px-4` (Mobile), `px-8` (Desktop)
- **Jarak antar Seksi**: `py-20` atau `py-32`
- **Grid Gap**: `gap-8` (Standar untuk Card Grid)
- **Border Radius**: 
  - `rounded-2xl` (16px) untuk Card
  - `rounded-[2rem]` (32px) untuk Tombol Utama & Input

---

## **Komponen UI Utama**

### **1. Tombol (Buttons)**
Gunakan `AnimatedButton` atau class berikut untuk tombol utama:
```javascript
"group relative flex items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-primary px-8 py-5 text-xl font-black text-white shadow-2xl shadow-primary/30 transition-all hover:bg-accent hover:shadow-primary/40"
```

### **2. Card (Mata Pelajaran & Guru)**
- Gunakan `Framer Motion` untuk animasi hover.
- Shadow: `shadow-xl shadow-slate-200/50`.
- Border: `border border-slate-100`.

### **3. Badge**
Gunakan `Badge` untuk label kategori:
```javascript
"inline-flex items-center rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20"
```

### **4. Search & Stats Bar**
Digunakan untuk pencarian dan informasi ringkas.
- **Input**: `rounded-[2rem]`, `shadow-2xl`, `focus:ring-[#3C5DFF]/20`.
- **Stats Card**: `min-w-[300px]`, `items-center`, `justify-between`.
- **Responsivitas**: Menggunakan `flex-col` pada mobile dan `md:flex-row` pada tablet/desktop.

---

## **Aksesibilitas (WCAG 2.1)**

1. **Kontras**: Pastikan teks di atas latar belakang memiliki rasio kontras minimal 4.5:1.
2. **Interaksi**: Semua elemen interaktif harus memiliki state `:hover` dan `:focus` yang jelas.
3. **Alt Text**: Berikan deskripsi pada semua gambar penting.
4. **Responsivitas**: UI harus dapat digunakan sepenuhnya pada lebar layar minimal 320px.

---

## **Panduan Pengembangan**

1. **Tailwind First**: Gunakan utility classes Tailwind sebelum menulis CSS kustom.
2. **Framer Motion**: Gunakan untuk transisi halaman dan interaksi mikro (hover, tap).
3. **Lazy Loading**: Terapkan pada gambar besar untuk optimasi performa.
4. **Consistency**: Selalu rujuk ke `tailwind.config.js` untuk nilai warna dan spacing.
