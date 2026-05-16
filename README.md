# Budgetin

Budgetin adalah aplikasi manajemen keuangan pribadi yang membantu Anda melacak pengeluaran, merencanakan anggaran, dan memantau tagihan mendesak dengan mudah. Pengalaman *tracking* keuangan menjadi lebih mulus dan interaktif.

## 🚀 Fitur Utama

- **Pencatatan Keuangan**: Catat dengan mudah semua pemasukan dan pengeluaran harian Anda.
- **Smart Savings (Segera Hadir)**: Fitur tabungan cerdas untuk membantu Anda mengatur dan mencapai target tabungan secara lebih terarah.
- **Tagihan Mendesak**: Kemampuan untuk menandai pengeluaran sebagai tagihan mendesak (*urgent bills*) secara manual untuk memprioritaskan pembayaran melalui form transaksi.
- **Laporan & Analitik**: Visualisasi data pengeluaran dan pemasukan dengan *bar chart* yang jelas dan tabel transaksi detail berdasarkan periode waktu (Harian, Mingguan, Bulanan, Tahunan).
- **Keamanan & Autentikasi**: Mendukung pendaftaran akun anonim (Guest), *upgrade* ke akun permanen, autentikasi multi-faktor (MFA), dan login dengan Google OAuth yang aman.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan _stack_ modern:
- **Framework**: [Next.js](https://nextjs.org/) (App Router, Versi 16)
- **Backend (BaaS)**: [Supabase](https://supabase.com/) (Database PostgreSQL & Auth)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualisasi Data**: [Recharts](https://recharts.org/)
- **State & Data Management**: [Zustand](https://zustand-demo.pmnd.rs/), [React Query](https://tanstack.com/query/latest), [React Hook Form](https://react-hook-form.com/) & Zod
- **Rate Limiting**: [Upstash Redis](https://upstash.com/)

## ⚙️ Persyaratan Sistem

Sebelum menjalankan proyek ini, pastikan Anda telah menyiapkan:
- [Node.js](https://nodejs.org/) (Versi 18+ disarankan) atau [Bun](https://bun.sh/)
- Akun [Supabase](https://supabase.com/) untuk Database dan Autentikasi
- Akun [Upstash](https://upstash.com/) untuk instance Redis (Opsional, untuk Rate Limiting)

## 💻 Panduan Menjalankan Proyek Secara Lokal

Ikuti langkah-langkah berikut untuk mereplikasi dan menjalankan "Budgetin" di komputer (lokal) Anda:

### 1. Kloning Repositori

```bash
git clone <URL_REPOSITORY_ANDA>
cd budgetin
```

### 2. Instalasi Dependensi

Disarankan menjalankan instalasi via `bun`, namun `npm`, `yarn`, atau `pnpm` juga dapat digunakan.

```bash
bun install
# atau
npm install
```

### 3. Konfigurasi Variabel Lingkungan (.env)

Buat file bernama `.env.local` di *root* direktori proyek, lalu isi dengan kredensial Supabase dan Upstash Anda sebagai berikut:

```env
# URL dan Keys Supabase (Bisa didapat dari Project Settings -> API di dashboard Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth Google Secret (Opsional jika ingin mengaktifkan Google Login)
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-oauth-secret

# Konfigurasi Upstash Redis (Untuk API Rate Limiting perlindungan Auth)
UPSTASH_REDIS_REST_URL=https://your-upstash-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### 4. Setup Skema Database (Supabase)

Pastikan *backend* Supabase Anda memiliki tabel dan keamanan (RLS) yang diperlukan. Anda dapat menjalankan *migrations* menggunakan Supabase CLI, atau mengeksekusi SQL di tab SQL Editor Supabase:

```bash
# Contoh dengan Supabase CLI
npx supabase link --project-ref your-project-ref
npx supabase db push
```
*(Catatan: Sesuaikan dengan struktur schema proyek ini seperti pembuatan tabel pendaftaran, transaksi, kategori, dsb.)*

### 5. Jalankan Development Server

Mulai server lokal:

```bash
bun run dev
# atau
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser (seperti Chrome/Edge/Firefox) untuk melihat hasil run proyek. Semua perubahan pada kode akan diperbarui secara otomatis.

---
*Dikembangkan sebagai bagian dari penyelesaian program Capstone Project - CC26-PS108 (Dicoding).*
