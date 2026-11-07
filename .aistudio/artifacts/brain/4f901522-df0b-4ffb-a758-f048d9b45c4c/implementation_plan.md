# Rencana Implementasi (Revisi Final): Dynamic Full JCI Auto-Discovery (~956 → 1000+ Emiten), Indikator Sync Profesional Tanpa Teks "SYNCED", Perbaikan Tabel Screener, Sentimen Berita Objektif & Fix GitHub Actions

## 1. Indikator Sinkronisasi Profesional & Hemat Ruang (Tanpa Teks `"SYNCED"` dan Tanpa Emoji)

- **Masalah Sebelumnya**: Badge bertuliskan `✓ SYNCED` atau `⏳ PENDING` pada setiap baris saham di Tabel Screener, Keranjang 1 & 2, Global Macro Wire, dan Header memakan banyak ruang horizontal.
- **Perbaikan**:
  - Menghapus kata **`SYNCED`** / **`PENDING`** pada badge status per-item di `ScreeningTable.tsx`, `BarbellAllocatorCard.tsx`, `GlobalMacroPulse.tsx`, `MarketRegimeBanner.tsx`, `ActivePortfolioManager.tsx`, dan `Header.tsx`.
  - Menggantinya dengan **ikon vektor SVG profesional berukuran ringkas (`<RefreshCw className="w-3 h-3" />` / simbol kuantitatif `↻` tanpa emoji)** dengan warna hijau zamrud (`text-[#0D5C46]`) saat sudah tersinkronisasi dan amber (`text-[#D97706]`) saat sedang memuat, dilengkapi atribut `title="Data Tersinkronisasi Live"` saat kursor diarahkan (*hover*).
  - Hasilnya jauh lebih bersih, institusional, dan menghemat ruang kolom secara signifikan.

---

## 2. Arsitektur Adaptif Jumlah Emiten JCI (~956 Emiten & Auto-Scaling Realtime)

- **Katalog & Mesin Auto-Discovery Emiten BEI (`src/data/idxAllEmitenCatalog.ts` & `src/utils/liveMarketFetcher.ts`)**:
  - Memuat secara default **seluruh ~956 emiten BEI (`.JK`) per November 2026** lintas 11 sektor IDX-IC agar **Keranjang 1 & 2 (`BarbellAllocatorCard`)** dan **Matriks Screener 4-Faktor (`ScreeningTable`)** selalu mengevaluasi keseluruhan pasar BEI.
  - Dilengkapi **Dynamic JCI Emiten Auto-Discovery** yang mendeteksi emiten `.JK` baru dari direktori/screener pasar secara otomatis; apabila jumlah emiten di BEI bertambah (misalnya menjadi **980 atau 1.000+ emiten**), jumlah saham yang disinkronkan dan ditampilkan (`stocks.length`) otomatis menyesuaikan secara *real-time* tanpa batas statis.

---

## 3. Perbaikan Tata Letak & Warna pada Tabel Screener (`src/components/ScreeningTable.tsx`)

1. **Baris Baru untuk `σ · β · ROE` (Tidak Terpotong)**:
   - Memisahkan informasi pada kolom `Emiten & Sektor (σ · β · ROE)` menjadi:
     - **Baris 1**: Nama Emiten (`font-bold text-[#111315]`)
     - **Baris 2**: Sektor BEI (`text-[#0284C7] bb-cyan font-semibold`)
     - **Baris 3 (Baris Baru Khusus Indikator)**: `σ {stock.volatilityAnn}% · β {stock.beta1Y.toFixed(2)}x · ROE {stock.roe.toFixed(1)}%` (`whitespace-nowrap`) sehingga nilai **Volatilitas (`σ`), Beta (`β`), dan `ROE` terlihat utuh 100% tanpa terpotong `...`**.
2. **Rata Tengah (`text-center`) untuk Seluruh Nilai Indikator**:
   - Mengubah alignment `<th>` dan `<td>` pada kolom **`Low-Vol`**, **`Mom Live`**, **`Value`**, **`Size/Liq`**, **`Skor Total`**, dan **`Buffer 40%`** menjadi **`text-center`** agar nilai indikator rata tengah dan tidak mepet ke kanan.
3. **Warna Independen untuk Return `1D` vs `30D` (`+` Hijau, `-` Merah)**:
   - Memisahkan elemen `<span>` dan evaluasi warna antara persentase `1D` dan `30D`:
     - **`1D`**: Hijau (`text-[#0D5C46]`) jika `change1D >= 0`, Merah (`text-[#9E2A2B]`) jika `change1D < 0`.
     - **`30D`**: Hijau (`text-[#0D5C46]`) jika `return30D >= 0`, Merah (`text-[#9E2A2B]`) jika `return30D < 0`.
   - Nilai `30D` yang minus (misal `30D: -22.0%` atau `30D: -3.1%`) kini tampil **merah** secara akurat meskipun `1D`-nya positif.

---

## 4. Penghapusan Navigasi Halaman Redundan di Page 1 (`src/App.tsx`)

- Menghapus blok 2 kartu navigasi bawah pada Tab 01 (`03. Evaluasi Portofolio Aktif & GitHub Cloud Sync` dan `02. Buka Screener 4-Faktor`) karena perpindahan halaman sudah terakomodasi penuh oleh **Sticky Menu Bar** di bagian atas.

---

## 5. Klasifikasi Sentimen Berita Objektif (`MarketNewsSentiment.tsx` & `liveMarketFetcher.ts`)

- Menghapus fallback default `'RISK_ON'` (`SENTIMEN POSITIF // BULLISH`) dan menerapkan **Weighted Lexicon Polarity Scorer** dwibahasa (Indonesia & Inggris) pada gabungan `title` + `summary`.
- Menambahkan kategori `'NEUTRAL'` (`SENTIMEN NETRAL // OBJEKTIF`) serta memastikan berita negatif/risiko/kesulitan finansial diklasifikasikan secara objektif sebagai `'RISK_OFF'` (`SENTIMEN NEGATIF // RISK-OFF`).

---

## 6. Perbaikan Error Deploy GitHub Actions (`ERESOLVE` `vite` vs `esbuild`)

- Memperbarui `"esbuild"` di `package.json` menjadi `"^0.27.0"` agar kompatibel dengan `vite@8.3.6` (`peerOptional esbuild@"^0.27.0 || ^0.28.0"`).
- Memperbarui `.github/workflows/deploy-pages.yml` dengan `node-version: 22` dan `npm install --legacy-peer-deps --no-audit --no-fund`, serta memperbarui `public/static-market-snapshot.json` dan bundle `/docs`.
