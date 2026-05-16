# Performance Audit Engine — Budgetin (Next.js App Router + Vercel)

Diaudit: 2026-04-06 (Asia/Jakarta)  
Basis: inspeksi kode + output `webpack-bundle-analyzer` (`.next/analyze/client.html`)

---

## 1) SERVER-SIDE DATA FETCHING

### Temuan S1 — Waterfall “Auth hop” di setiap API call (Supabase `auth.getUser()` lalu query DB)
1. Temuan (Problem)  
   Hampir semua Route Handler memanggil `getAuthUser()` yang melakukan `supabase.auth.getUser()` **lebih dulu**, baru menjalankan query PostgREST/SQL.
2. Dampak ke performa (Impact)  
   Setiap request API jadi **minimal 2 round-trip** ke Supabase (Auth + DB) → latency naik, terutama terasa pada load awal ketika UI menembak beberapa endpoint paralel.
3. Bukti / indikasi (Evidence)  
   - `src/lib/auth.ts:11` → `createServerSupabase()` lalu `supabase.auth.getUser()`  
   - `src/lib/auth.ts:16` → `await supabase.auth.getUser()`  
   - Contoh downstream: `src/app/api/transactions/route.ts:26`, `src/app/api/monthly-summary/route.ts:15`
4. Solusi teknis (Fix)  
   - Target: **1 hop** ke Supabase per endpoint (atau 0 hop tambahan untuk auth).
   - Opsi A (paling “langsung”): **Hindari `getUser()` untuk sekadar dapat `user.id`** dengan memindahkan filter `user_id = ...` ke RLS/view (gunakan `auth.uid()` di DB), lalu query cukup dengan access token dari cookie via Supabase client.  
   - Opsi B (jika tetap perlu `user.id` di runtime): decode JWT access token secara lokal (tanpa network) untuk mengambil `sub` (user id) lalu pakai itu untuk filter, dan tetap gunakan Supabase client untuk query.  
   - Pastikan pengukuran: tambahkan `Server-Timing` per step (`auth`, `db`) di API untuk membuktikan pemangkasan hop.
5. Prioritas (High / Medium / Low)  
   High

### Temuan S2 — Waterfall di client “bootstrap data” (1 request jadi 4–5 request berantai)
1. Temuan (Problem)  
   Load awal melakukan rangkaian: fetch session → (opsional) buat anonymous session → load dashboard data → (wallets masih menyusul).
2. Dampak ke performa (Impact)  
   UI “terasa lambat” dan “freeze” karena data inti baru tersedia setelah beberapa RTT berurutan.
3. Bukti / indikasi (Evidence)  
   - `src/app/providers.tsx:75` → `loadSession()` fetch `/api/auth/session`  
   - `src/components/shared/DataLoader.tsx:76` → `budgetActions.loadFromApi()` setelah auth siap  
   - `src/store/budgetStore.ts:67` → `Promise.all([...])` lalu  
   - `src/store/budgetStore.ts:75` → `/api/wallets` masih di-fetch **setelahnya**
4. Solusi teknis (Fix)  
   - Gabungkan fetch menjadi **paralel** dan “fail-soft” untuk wallets memakai `Promise.allSettled`.
   - Contoh pola salah vs benar:
     ```ts
     // SALAH (wallets selalu menyusul)
     const [a, b, c] = await Promise.all([fa(), fb(), fc()]);
     const wallets = await fw();

     // BENAR (semua paralel, tapi wallets boleh gagal)
     const [transactionsRes, categoriesRes, profileRes, walletsRes] =
       await Promise.allSettled([fa(), fb(), fc(), fw()]);
     ```
   - Minimalkan blocking UI: render shell + skeleton, jangan “global overlay” menunggu semua endpoint selesai.
5. Prioritas (High / Medium / Low)  
   High

### Temuan S3 — Write-path transaksi melakukan 2 operasi server berurutan (insert + RPC update balance)
1. Temuan (Problem)  
   `POST /api/transactions` melakukan insert transaksi, lalu memanggil RPC `update_wallet_balance`.
2. Dampak ke performa (Impact)  
   P99 latency create transaksi membesar (2 operasi serial), dan UI akan terasa “lag” saat save.
3. Bukti / indikasi (Evidence)  
   - `src/app/api/transactions/route.ts:92` → `createTransaction(...)`  
   - `src/app/api/transactions/route.ts:95` → `supabase.rpc("update_wallet_balance", ...)`
4. Solusi teknis (Fix)  
   - Buat **1 RPC** di Postgres: `create_transaction_and_update_balance(...)` (atomic, satu hop).  
   - Atau pindahkan update balance ke trigger (jika konsistensi bisa event-driven) sehingga API cukup insert.
5. Prioritas (High / Medium / Low)  
   Medium

### Temuan S4 — Caching response tidak konsisten antar GET API routes
1. Temuan (Problem)  
   Sebagian endpoint GET sudah punya `Cache-Control`, sebagian belum (mis. `transactions`, `monthly-summary`).
2. Dampak ke performa (Impact)  
   Revisit cepat tetap memukul server (dan Supabase) → TTI memburuk di navigasi internal / back-forward.
3. Bukti / indikasi (Evidence)  
   - Ada caching: `src/app/api/wallets/route.ts:16`, `src/app/api/categories/route.ts:16`  
   - Tidak terlihat caching di: `src/app/api/transactions/route.ts`, `src/app/api/monthly-summary/route.ts`
4. Solusi teknis (Fix)  
   - Untuk data “per user” yang bisa stale 30–60s: set `Cache-Control: private, max-age=30, stale-while-revalidate=60`.  
   - Untuk data super sensitif: `no-store` tetap OK, tapi jangan dipakai default untuk semua.
5. Prioritas (High / Medium / Low)  
   Medium

---

## 2) CLIENT-SIDE PERFORMANCE

### Temuan C1 — Tab cache di `(main)/layout.tsx` menyimpan seluruh page tree dan tetap merender tab tersembunyi
1. Temuan (Problem)  
   Layout utama menyimpan `children` ke state cache dan merender semua tab (satu visible, sisanya `hidden`).
2. Dampak ke performa (Impact)  
   - Inactive tabs tetap ikut direkonsiliasi → main thread kerja ekstra → UI patah/jank.  
   - Komponen berat bisa tetap “hidup” (effects, queries, timers) walau tidak terlihat.
3. Bukti / indikasi (Evidence)  
   - `src/app/(main)/layout.tsx:30` → `setCache(...[pathname]: children)`  
   - `src/app/(main)/layout.tsx:39` → `tabPaths.map(...)` render semua tab wrapper  
   - `src/app/(main)/layout.tsx:1` → `"use client"` (layout jadi boundary hydration besar)
4. Solusi teknis (Fix)  
   - Simplest: **hapus tab cache** dan render hanya `children` aktif; gunakan `Link` prefetch untuk membuat navigasi tetap cepat.  
   - Jika butuh “keep state per tab”: batasi hanya tab tertentu + freeze offscreen (jangan render tree penuh dengan `hidden`).  
   - Contoh pola salah vs perbaikan minimal:
     ```tsx
     // SALAH: render 5 tab tree sekaligus
     {tabPaths.map(p => <div className={p===active?'block':'hidden'}>{cache[p]}</div>)}

     // BENAR: render hanya aktif (cache dihapus)
     {children}
     ```
5. Prioritas (High / Medium / Low)  
   High

### Temuan C2 — Double fetching React Query karena invalidate di `useTransactions`
1. Temuan (Problem)  
   Setelah user tersedia, `useQuery` fetch, lalu `useEffect` meng-invalidate `["transactions"]` sehingga refetch lagi.
2. Dampak ke performa (Impact)  
   Duplicate API calls, spike CPU (parsing + state update), dan memperpanjang waktu UI stabil setelah render.
3. Bukti / indikasi (Evidence)  
   - `src/hooks/useTransactions.ts:87` → `queryClient.invalidateQueries({ queryKey: ["transactions"] })`
4. Solusi teknis (Fix)  
   - Hapus invalidate berbasis `user` (queryKey sudah mengandung `user?.id`).  
   - Jika butuh refresh saat login/logout: invalidation cukup dilakukan dari event `auth:changed` (satu tempat).
   - Contoh:
     ```ts
     // SALAH
     useEffect(() => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); }, [user])

     // BENAR
     // (hapus effect) atau invalidate hanya saat benar-benar ada event auth
     ```
5. Prioritas (High / Medium / Low)  
   High

### Temuan C3 — Polling verifikasi email tiap 5 detik memukul API + Supabase Auth terus-menerus
1. Temuan (Problem)  
   Halaman verifikasi email melakukan polling `/api/auth/session` setiap 5 detik.
2. Dampak ke performa (Impact)  
   Beban network + server meningkat, dan pada device lambat bisa memicu jank (interval + JSON parse + render).
3. Bukti / indikasi (Evidence)  
   - `src/app/(auth)/verify-email/VerifyEmailClient.tsx:27` → `setInterval(check, 5000)`
4. Solusi teknis (Fix)  
   - Ubah jadi **focus-only** + tombol “Saya sudah verifikasi” (manual recheck).  
   - Jika tetap polling: pakai exponential backoff (5s → 10s → 20s …) dan stop setelah N menit.
5. Prioritas (High / Medium / Low)  
   Medium

### Temuan C4 — Halaman list besar tanpa virtualisasi (potensi freeze saat data membesar)
1. Temuan (Problem)  
   Rendering tabel/list transaksi berpotensi besar tanpa windowing/virtualization.
2. Dampak ke performa (Impact)  
   Scroll jank + input delay (INP naik) saat jumlah item meningkat.
3. Bukti / indikasi (Evidence)  
   - `src/app/transactions/page.tsx` → render table rows langsung (file sangat besar, banyak mapping)
4. Solusi teknis (Fix)  
   - Terapkan virtualization (`@tanstack/react-virtual`) untuk table rows.  
   - Pastikan pagination benar-benar membatasi DOM (bukan hanya data fetch).
5. Prioritas (High / Medium / Low)  
   Medium

---

## 3) BUNDLE SIZE ANALYSIS

### Temuan B1 — Supabase client sangat berat dan ikut termuat di initial load halaman auth
1. Temuan (Problem)  
   Auth pages mengimpor `supabase` browser client untuk Google OAuth, sehingga bundle membawa `@supabase/ssr` (besar).
2. Dampak ke performa (Impact)  
   Initial JS untuk `/login` membesar → hydration lebih lama → load awal terasa lambat.
3. Bukti / indikasi (Evidence)  
   - Import pemicu: `src/app/(auth)/login/_components/LoginForm.tsx:5`, `src/app/(auth)/signup/page.tsx:14`  
   - Bundle analyzer: chunk `static/chunks/6622-00e8713d08c2ab01.js` gzip `54174`  
   - Di dalamnya: `@supabase/ssr/dist/module` gzip `46649` (dominant)
4. Solusi teknis (Fix)  
   - Lazy load Supabase client **hanya saat tombol Google ditekan**:
     ```ts
     // contoh di handleGoogle()
     const { supabase } = await import('@/lib/supabase/client');
     await supabase.auth.signInWithOAuth(...);
     ```
   - Alternatif lebih agresif: pindahkan start OAuth ke server route (`/api/auth/oauth`) yang melakukan redirect URL dari Supabase → auth pages tidak perlu bundle Supabase sama sekali.
5. Prioritas (High / Medium / Low)  
   High

### Temuan B2 — Recharts chunk besar (walau sudah dynamic import), berpotensi “post-render jank”
1. Temuan (Problem)  
   Recharts (dan dependensi d3-*) tetap cukup berat ketika akhirnya di-load dan dieksekusi di client.
2. Dampak ke performa (Impact)  
   Setelah render awal, saat chunk chart masuk → main thread spike → UI terasa freeze/patah.
3. Bukti / indikasi (Evidence)  
   - Analyzer: `recharts` ~ gzip `68245` (di chunk `static/chunks/6957.5d963f77f282c48a.js`)  
4. Solusi teknis (Fix)  
   - Sudah benar memakai `next/dynamic` (`ssr:false`) di `src/app/(main)/beranda/HomeClient.tsx`.  
   - Tambahkan gating: render chart hanya saat in-view / idle (IntersectionObserver atau `requestIdleCallback`) agar tidak mengganggu interaksi awal.
5. Prioritas (High / Medium / Low)  
   Medium

### Temuan B3 — Baseline shared JS cukup besar; optimasi harus menarget “main-app” chunks
1. Temuan (Problem)  
   Shared JS (`main` + `framework` + `main-app`) adalah baseline yang harus dibayar hampir di semua route.
2. Dampak ke performa (Impact)  
   Di jaringan lambat, 100–200KB gzip ekstra = ratusan ms sampai detik untuk download + parse + execute.
3. Bukti / indikasi (Evidence)  
   - Analyzer: `main` total gzip `99428` (framework `59771` + main `37761`)  
   - Analyzer: `main-app` total gzip `115649` (dua chunk terbesar `62319` dan `51201`)
4. Solusi teknis (Fix)  
   - Pastikan library besar tidak masuk ke “shared” tanpa alasan (contoh: Supabase client, chart libs).  
   - Audit ulang setelah perbaikan B1 (biasanya langsung menurunkan baseline untuk auth routes).
5. Prioritas (High / Medium / Low)  
   Medium

---

## 4) NEXT.JS MIDDLEWARE

### Temuan M1 — Tidak ada `middleware.ts` saat ini (tidak ada overhead), tapi hati-hati bila menambah Supabase session refresh
1. Temuan (Problem)  
   Repo tidak punya `middleware.ts`. Namun ada helper `refreshSession()` yang bila dipakai di middleware akan memanggil `supabase.auth.getSession()`.
2. Dampak ke performa (Impact)  
   Jika middleware match terlalu luas, semua request (termasuk asset) ikut kena tambahan latency global.
3. Bukti / indikasi (Evidence)  
   - Tidak ada `middleware.ts` di repo (pencarian `middleware` hanya menemukan `zustand/middleware`)  
   - Helper: `src/lib/supabase/proxy.ts:11` dan `await supabase.auth.getSession()` (di file itu)
4. Solusi teknis (Fix)  
   - Jika membuat `middleware.ts`, gunakan matcher yang mengecualikan static assets:
     ```ts
     export const config = {
       matcher: [
         '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
       ],
     };
     ```
   - Batasi middleware hanya ke route yang benar-benar perlu auth/refresh.
5. Prioritas (High / Medium / Low)  
   Low (karena belum ada middleware)

---

## 5) ANTI-PATTERN: SERVER COMPONENT MEMANGGIL `/api` SENDIRI

### Temuan A1 — Tidak terdeteksi saat ini, tapi wajib dicegah saat mulai pindah ke Server Components
1. Temuan (Problem)  
   Server Component yang melakukan `fetch('/api/...')` membuat “serverless chaining” (server → server).
2. Dampak ke performa (Impact)  
   Di Vercel: extra hop + cold start tambahan + tracing/debug makin sulit.
3. Bukti / indikasi (Evidence)  
   - Match `fetch('/api/...')` ada, tetapi semuanya berada di file `"use client"` (mis. `src/app/providers.tsx:77`).
4. Solusi teknis (Fix)  
   - Refactor pola berikut saat membuat Server Component:
     ```ts
     // SALAH (Server Component)
     const res = await fetch('https://your-app.vercel.app/api/wallets');

     // BENAR: direct call service layer
     import { getAllWallets } from '@/app/api/wallets/service/wallet.service';
     ```
5. Prioritas (High / Medium / Low)  
   Low (sekarang), High (saat migrasi SSR/Server Components)

---

## 6) SUPABASE MIDDLEWARE BOTTLENECK

### Temuan SM1 — Belum ada bottleneck middleware auth (karena belum ada middleware), tapi Supabase refresh di middleware bisa jadi sumber latency global
1. Temuan (Problem)  
   Jika `refreshSession()` dijalankan di middleware untuk semua request, Anda menambahkan dependency ke Supabase Auth pada critical path request.
2. Dampak ke performa (Impact)  
   Latency naik lintas region (global) dan asset delivery ikut lambat jika matcher salah.
3. Bukti / indikasi (Evidence)  
   - `src/lib/supabase/proxy.ts` melakukan `await supabase.auth.getSession()` (network-bound).
4. Solusi teknis (Fix)  
   - Jika butuh: limit matcher + hanya untuk route protected + lakukan refresh secara conditional (mis. hanya jika token hampir expired).
5. Prioritas (High / Medium / Low)  
   Low (karena belum digunakan)

---

## 7) CLIENT LOAD: RECHARTS & FRAMER MOTION

### Temuan CF1 — Recharts sudah di-dynamic import, tapi tetap perlu “defer execution” untuk menghindari jank
1. Temuan (Problem)  
   Chart libs dieksekusi di main thread ketika chunk selesai load.
2. Dampak ke performa (Impact)  
   UI freeze sesaat setelah render (sesuai gejala).
3. Bukti / indikasi (Evidence)  
   - `src/app/(main)/beranda/HomeClient.tsx` sudah memakai `dynamic(..., { ssr:false })`  
   - Ukuran: lihat Temuan B2
4. Solusi teknis (Fix)  
   - Render chart setelah user idle / scroll masuk viewport (component wrapper `ChartDeferred`).
5. Prioritas (High / Medium / Low)  
   Medium

### Temuan CF2 — Framer Motion tidak ditemukan di source (hanya ada jejak di lockfile)
1. Temuan (Problem)  
   Tidak ada import `framer-motion` di `src/` saat audit ini.
2. Dampak ke performa (Impact)  
   Tidak berdampak sekarang; tapi bila ditambahkan global (mis. di layout), risikonya sama seperti Supabase client: masuk baseline bundle.
3. Bukti / indikasi (Evidence)  
   - `rg "framer-motion" src` tidak menemukan hasil (audit lokal)
4. Solusi teknis (Fix)  
   - Jika dipakai nanti: dynamic import per halaman/komponen, jangan global provider.
5. Prioritas (High / Medium / Low)  
   Low

---

## 8) REACT QUERY + APP ROUTER

### Temuan RQ1 — Tidak ada SSR prefetch/hydration; terjadi bootstrap waterfall + duplikasi fetching via stores
1. Temuan (Problem)  
   Data inti dashboard dimuat via `DataLoader` + custom store, sementara sebagian halaman juga memakai React Query → potensi duplikasi dan waterfall.
2. Dampak ke performa (Impact)  
   - Load awal butuh beberapa RTT sampai data siap.  
   - State update berlapis (store + query) memicu re-render berantai.
3. Bukti / indikasi (Evidence)  
   - `src/components/shared/DataLoader.tsx` memanggil `budgetActions.loadFromApi()`  
   - React Query aktif global: `src/app/providers.tsx:111` membuat `QueryClient`
4. Solusi teknis (Fix)  
   - Pilih 1 strategi sebagai “source of truth”: React Query (recommended) atau custom store.  
   - Jika ingin SSR untuk UX: prefetch di Server Component + `dehydrate` + `HydrationBoundary`:
     ```tsx
     // contoh skeleton (App Router)
     import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
     export default async function Page() {
       const qc = new QueryClient();
       await qc.prefetchQuery({ queryKey: ['wallets'], queryFn: fetchWalletsServer });
       return <HydrationBoundary state={dehydrate(qc)}><Client /></HydrationBoundary>;
     }
     ```
5. Prioritas (High / Medium / Low)  
   Medium

---

## 9) SUPABASE FREE TIER LATENCY (COLD START)

### Temuan SF1 — Pola “request pertama lambat, berikutnya cepat” sangat mungkin (Supabase + Vercel cold start)
1. Temuan (Problem)  
   Kombinasi: Vercel Functions cold start + Supabase free tier yang bisa mengalami warming/latency spike.
2. Dampak ke performa (Impact)  
   Gejala yang user rasakan: load pertama lambat (terlihat seperti SSR delay), load berikutnya jauh lebih cepat.
3. Bukti / indikasi (Evidence)  
   - Banyak endpoint kritikal bergantung pada Supabase Auth/DB (lihat Temuan S1, S2).
4. Solusi teknis (Fix)  
   - Kurangi jumlah “first-hit” endpoint (hilangkan hop auth per endpoint, paralelkan bootstrap).  
   - Tambahkan keep-warm via Vercel Cron (ping ringan ke `/api/status`) untuk menurunkan cold start (tradeoff: biaya/kuota).
5. Prioritas (High / Medium / Low)  
   Medium

