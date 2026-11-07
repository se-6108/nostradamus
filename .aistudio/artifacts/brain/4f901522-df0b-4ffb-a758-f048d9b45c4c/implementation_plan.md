# Filter Likuiditas Ketat Keranjang 1 & 2, Indikator Dividen, Live Sync GitHub Pages & Sticky Compact Footer

Rencana pembaruan ini mengatasi anomali masuknya saham tidak likuid/stagnan (seperti saham *gocap*, suspensi, atau harga *fallback* yang tidak valid di Yahoo Finance) ke dalam Keranjang 1 & 2, mengaktifkan penarikan data *live* beserta progres *loading* nyata saat tombol Sync ditekan di GitHub Pages, menambahkan indikator pembagian dividen (`Yield %`) dengan prioritas pada Keranjang 1, serta menjadikan *footer bar* di bagian bawah layar *sticky* dan ringkas (`36px`).

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan yang telah dikonfirmasi dari jawaban Anda dan siap dieksekusi:

- **Keputusan 1 — Blokir Saham Tidak Likuid / Stagnan / Tanpa Harga Live Valid dari Keranjang 1 & 2**: Saham yang terdeteksi tidak likuid, stagnan (misalnya harga $\le \text{Rp } 65$, pergerakan harian `0.00%` beruntun seperti `MKNT.JK` pada Rp 32, atau tidak memiliki kuotasi *live* valid di Yahoo Finance seperti `FORZ`/`FORU`) **diblokir sepenuhnya dari Keranjang 1 & Keranjang 2**, tidak lagi diberi skor *Low-Volatility* palsu (`9.9/10`), serta diberi penanda **`Illiquid`** pada tabel Screener.
- **Keputusan 2 — Badge Tanda Dividen (`Yield %`) & Prioritas di Keranjang 1**: Emiten pembagi dividen rutin (seperti konstituen *IDX High Dividend 20*, perbankan utama, komoditas kas kuat, dan *consumer compounders*) menampilkan indikator **`DIV · Yield X.X%`** di Screener maupun kartu Keranjang, sekaligus mendapatkan tambahan bobot kualitas pada seleksi **Keranjang 1 (Defensive Quality & Dividend Core)**.
- **Keputusan 3 — Sticky Compact Footer Bar (`36px`) di Bawah Layar**: Footer diubah menjadi bilah tipis `sticky bottom-0 z-30` setinggi `36px` sehingga selalu menempel rapi di bawah layar tanpa mengurangi ruang baca tabel Screener.
- **Keputusan 4 — Live Browser Sync dengan Loading Progress Nyata di GitHub Pages**: Saat tombol Sync diklik di GitHub Pages (`*.github.io`), aplikasi tidak lagi langsung selesai dalam `0ms` menggunakan memori lama, melainkan menjalankan penarikan *batch* nyata ke Yahoo Finance melalui *multi-relay CORS browser fetcher* disertai indikator progres (`Syncing X/Y...`) dan pembaruan harga aktual.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Deteksi Likuiditas & Anti-Gocap Trap pada Mesin Kuantitatif**: Memperbaiki rumus `computeBetaAndVolatility` dan `computeDeMiguelFourFactors` agar saham tidur/suspensi yang garis grafiknya datar (`stdDev ≈ 0%`) tidak disalahartikan sebagai saham "Low Volatility terbaik", melainkan ditandai sebagai **`Illiquid`** dan dikecualikan dari alokasi modal Keranjang 1 & 2.
  2. **Penghapusan Harga Default Palsu**: Menghapus generator harga sintetis (`approxPrice` / `buildCalibratedSparkSeries`) untuk saham yang gagal ditarik dari Yahoo Finance agar saham tanpa harga *live* valid tidak pernah menyelinap masuk ke rekomendasi portofolio.
  3. **Live Browser Sync di GitHub Pages**: Menghadirkan mekanisme *chunked live fetch* langsung dari browser di GitHub Pages (menggunakan *CORS-safe Yahoo Spark relay* + *cache-busted snapshot fetch*) sehingga tombol Sync menampilkan progres *loading* bertahap dan memperbarui harga saham secara nyata.
  4. **Indikator Dividen (`dividendYieldPct`)**: Menampilkan *yield* dividen tahunan pada setiap emiten pembagi dividen di Screener dan Keranjang 1/2.
  5. **Sticky Compact Footer Bar**: Menjaga informasi hak cipta, akses cepat *Arsitektur & Kode Sumber*, dan status sesi tetap terlihat di bagian bawah layar dalam bar tipis `36px`.

---

## 2. User Experience & Visual Design

- **Indikator Likuiditas & Dividen pada Tabel Screener & Kartu Keranjang**:
  - **Emiten Pembagi Dividen**: Menampilkan teks indikator bersih `DIV 5.8%` berwarna hijau zamrud (`#059669` / `#34D399`) di samping ticker/sektor.
  - **Emiten Tidak Likuid / Stagnan**: Menampilkan penanda `ILLIQUID · STAGNAN` berwarna abu-abu/merah redup di Screener dan otomatis diberi status zona `ROTATE_OUT` (tidak pernah masuk Keranjang 1 atau 2).
- **Sticky Compact Bottom Footer (`36px`)**:
  - Berukuran tinggi `36px` (`h-9 px-4 sticky bottom-0 z-30 backdrop-blur-md`), memuat kredit `© 2026 Nostradamus Quant Terminal · Credit: Fayadh` di sisi kiri dan tombol akses cepat `Arsitektur & Kode Sumber` di sisi kanan.
- **Interactive Loading Feedback pada Tombol Sync (GitHub Pages & AI Studio)**:
  - Saat tombol Sync ditekan di GitHub Pages, ikon `<RefreshCw className="animate-spin" />` berputar aktif dengan progres teks `Syncing 40/896...` hingga selesai menarik pembaruan kuotasi *live*.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mengapa Saham Tidur / Gocap Sebelumnya Masuk ke Keranjang 1?**
  - *Akar Masalah*: Pada rumus sebelumnya, saham yang tidak bergerak sama sekali (contoh `MKNT.JK` di Rp 32 dengan perubahan `0.00%` setiap hari) memiliki standar deviasi return harian `0%`. Rumus Low-Volatility sebelumnya menganggap `volatilitas 0% = risiko paling rendah (skor 9.9/10)`. Selain itu, saham yang tidak ditemukan di Yahoo Finance diberi harga *fallback* (`approxPrice`) yang tampak normal.
  - *Solusi*: Menambahkan syarat **Active Price Discovery & Liquidity Gate**:
    1. Minimal `35%` hari bursa dalam 30 hari terakhir harus memiliki pergerakan harga aktif ($\neq 0\%$).
    2. Harga penutupan terakhir wajib di atas batas saham tidur/gocap ($\ge \text{Rp } 68$) dan memiliki kuotasi *live* Yahoo Finance yang terverifikasi.
    3. Saham yang gagal memenuhi syarat ini ditandai `isLiquid: false`, diberikan penalti skor *Low-Vol* (`1.5/10`), dan **diblokir mutlak** dari fungsi `computeOptimalHRPBarbellPortfolio` (Keranjang 1 & 2).

- **Decision 2: Live Sync Nyata di GitHub Pages Tanpa Backend Server**
  - *Akar Masalah*: Di AI Studio tersedia Express backend (`/api/yahoo/spark`), sedangkan di GitHub Pages hanya tersedia hosting statis sehingga sebelumnya fungsi Sync langsung melewati proses *fetch* dan selesai dalam `0ms`.
  - *Solusi*: Saat berjalan di GitHub Pages, fungsi `fetchYahooSparkBatch` akan melakukan *live batch request* ke endpoint Yahoo Finance Spark melalui *multi-endpoint CORS proxy* (`codetabs` / `allorigins` / *cache-busted repo snapshot*) dengan progres per *batch* yang terlihat nyata oleh pengguna.

- **Decision 3: Integrasi Faktor Dividen ke Keranjang 1**
  - *Chosen Approach*: Menambahkan atribut `dividendYieldPct: number` pada `StockMetrics`. Pada seleksi **Keranjang 1 (Defensive Quality Core)**, emiten likuid dengan fundamental kuat dan pembagian dividen rutin memperoleh *dividend quality boost* sehingga Keranjang 1 benar-benar berisi saham *defensive compounders* & pembagi dividen yang likuid.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   STICKY TOP SHELL (Header + Menu + Pulse)                 │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│               HYBRID LIVE YAHOO FINANCE ENGINE (GitHub & Local)            │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ Local / AI Studio Preview        │  │ GitHub Pages (*.github.io)     │  │
│  │ Express /api/yahoo/spark batches │  │ Multi-Relay CORS Yahoo Fetcher │  │
│  │ + Real-time progress counter     │  │ + Cache-busted JSON + Progress │  │
│  └─────────────────┬────────────────┘  └────────────────┬───────────────┘  │
└────────────────────┼────────────────────────────────────┼──────────────────┘
                     └─────────────────┬──────────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             LIQUIDITY, ANTI-GOCAP & DIVIDEND QUANT FILTER                  │
│  • Active Trading Ratio Check: >= 35% active price discovery days          │
│  • Price Floor Gate: lastPrice >= Rp 68 & verified Yahoo Finance quote     │
│  • If Stagnant/Gocap/Unverified -> isLiquid = false (Blocked from Baskets) │
│  • Dividend Registry: attaches dividendYieldPct (%) & boosts Keranjang 1   │
└────────────────────┬────────────────────────────────────┬──────────────────┘
                     ▼                                    ▼
┌─────────────────────────────────────────┐  ┌───────────────────────────────┐
│  KERANJANG 1 & 2 BARBELL ALLOCATOR      │  │  4-FACTOR SCREENER TABLE      │
│  • Strictly filters s.isLiquid === true │  │  • Shows DIV Yield % indicator│
│  • Prioritizes Liquid Dividend + LowVol │  │  • Marks Illiquid stocks      │
└─────────────────────────────────────────┘  └───────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│        STICKY COMPACT FOOTER BAR (sticky bottom-0 z-30 h-9 / 36px)         │
└────────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Data Model (`StockMetrics`)**:
  - Menambahkan `isLiquid?: boolean` (menentukan kelayakan masuk Keranjang 1 & 2 serta badge `Illiquid` di Screener) dan `dividendYieldPct?: number` (persentase estimasi *dividend yield* tahunan untuk emiten pembagi dividen).
- **Keranjang 1 & Keranjang 2 (`computeOptimalHRPBarbellPortfolio` & `BarbellAllocatorCard`)**:
  - Memfilter kandidat dengan syarat wajib `s.isLiquid !== false && s.lastPrice >= 68`, menampilkan indikator `DIV X.X%` pada baris emiten yang membagikan dividen, serta menambahkan bonus skor dividen pada `computeSleeveSpecificScore` untuk Keranjang 1.
- **Screener (`ScreeningTable`)**:
  - Menampilkan penanda `DIV X.X%` pada saham pembagi dividen dan penanda `Illiquid` pada saham yang tidak likuid/stagnan.
- **Sticky Compact Footer (`App.tsx`)**:
  - Mengubah `<footer>` menjadi `sticky bottom-0 z-30 h-9 px-4` dengan tata letak satu baris yang ringkas di bagian bawah layar.
