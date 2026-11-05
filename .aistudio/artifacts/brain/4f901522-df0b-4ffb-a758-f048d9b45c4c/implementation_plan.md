# Nostradamus Quant — Tata Letak Tab Menu di Bawah Header, Logo Kompas Pelaut & Kamus Hover Bahasa Awam

Pembaruan ini menata ulang struktur navigasi agar **Tab Menu Bar berada di bawah baris utama Header** (menghilangkan penumpukan horizontal di kanan layar), mengganti logo dengan **Kompas Pelaut (Mariner's Compass Rose) ala Nostradamus** tanpa unsur mata sama sekali, serta menambahkan **Tooltip Penjelasan Bahasa Awam (saat kursor diarahkan / *hover*)** pada setiap istilah dan metrik kuantitatif.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Tiga Penyempurnaan Utama Sesuai Tangkapan Layar & Masukan Anda:**
> 1. **Tab Menu Bar Dipindahkan ke Baris Khusus di Bawah Header**:
>    - Baris atas Header kini hanya memuat **Logo Kompas Pelaut + Judul & Waktu Update Terakhir** di sisi kiri, serta tombol **SYNC SEMUA LIVE + GitHub Cloud + Mode Tema** di sisi kanan.
>    - Kelima menu utama (`01. Command & Allocator` s/d `05. Macro & News Wire`) ditempatkan pada **baris navigasi khusus di bawah Header** sehingga ruang jauh lebih lega, proporsional, dan tidak pernah terpotong ke kanan.
> 2. **Logo Kompas Pelaut (Nautical Mariner's Compass Rose) Tanpa Unsur Mata**:
>    - Menghapus seluruh elemen menyerupai mata dan menggantinya dengan **Kompas Pelaut 8-Penjuru Angin (N-E-S-W Mariner's Compass Rose)** lengkap dengan cincin derajat azimut, penunjuk arah Utara emas-zamrud, dan jarum navigasi maritim.
> 3. **Tooltip Hover Bahasa Awam pada Seluruh Metrik Quant**:
>    - Setiap metrik teknis dilengkapi indikator *hover* yang langsung menampilkan **arti dalam bahasa sehari-hari (awam)** beserta **cara membacanya secara praktis** tanpa perlu membuka halaman dokumentasi.

---

### 1. Overview & Core Concept

- **What It Does**: Menyajikan terminal kuantitatif BEI yang ramah dibaca baik oleh analis berpengalaman maupun investor awam berkat penjelasan *hover* instan pada setiap angka, tata letak header dua tingkat yang lega, dan identitas visual Kompas Pelaut.
- **Target Audience / Persona**: Investor saham Indonesia dan *trader* yang menginginkan kekuatan perhitungan matematis institusional tetapi disajikan dengan bahasa yang membumi, jelas, dan mudah dipahami.
- **Key Value**: Bebas kebingungan istilah statistik (seperti *Realized Volatility*, *Beta*, *OOS Net Sharpe*, *Rebalancing Buffer*, *Low-Vol*, *Mom 12-1*) karena semuanya dijelaskan secara instan saat kursor diarahkan (*hover*).

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Navigasi Dua Tingkat yang Lega**: Pengguna melihat baris identitas utama di atas dan baris **5 Tab Menu** yang rapi tepat di bawahnya tanpa ada tombol yang terdesak ke luar layar.
  2. **Hover Kamus Bahasa Awam (`MetricTooltip`)**: Saat pengguna mengarahkan kursor ke nama metrik mana pun (di Banner Sentimen, Kalkulator Keranjang 1 & 2, Tabel Screener, maupun Evaluasi Portofolio), muncul kotak informasi ringkas berisi:
     - **Arti Bahasa Awam**: Penjelasan sederhana bebas jargon.
     - **Panduan Angka**: Patokan praktis apakah angka tersebut bagus, aman, atau perlu diwaspadai.
- **Visual Identity & Theme**:
  - **Kompas Pelaut (Mariner's Compass Rose)**: Geometri bintang kompas 8 arah dengan cincin derajat pelayaran kuno ala navigator abad ke-16.
  - **Hover Tooltip Presisi**: Desain kartu *popover* ringan berbingkai tegas yang otomatis menyesuaikan tema *Dark Terminal* maupun *Daylight Mode*.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Pemisahan Baris Identitas Header & Baris Tab Menu**:
  - *Chosen Approach*: Menyusun `<Header />` menjadi 2 baris terstruktur: Baris 1 untuk *Brand + Timestamp + Action Buttons*, dan Baris 2 untuk *Full-Width 5-Tab Workspace Navigation Bar*.
  - *Why*: Mencegah *horizontal overflow* pada layar laptop standar (1280px–1440px) ketika teks waktu update lengkap ditampilkan.
- **Decision 2 — Komponen `MetricTooltip` Berbasis CSS/React Hover Instan**:
  - *Chosen Approach*: Membuat komponen pembungkus label metrik dengan garis bawah titik-titik halus (`border-dotted`) dan ikon informasi kecil yang menampilkan penjelasan bahasa awam tanpa jeda (*zero-latency hover*).
  - *Why*: Menjaga tampilan tabel dan kartu tetap bersih (tidak penuh teks panjang), namun penjelasan selalu tersedia kapan saja dibutuhkan.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│ BARIS 1 HEADER: [Kompas Pelaut Logo] NOSTRADAMUS QUANT + Waktu Update      │
│                 [SYNC SEMUA LIVE]  [GitHub Cloud]  [Daylight / Dark Mode]  │
├────────────────────────────────────────────────────────────────────────────┤
│ BARIS 2 TAB BAR: [01. Command & Allocator] [02. Multifactor Screener]      │
│                  [03. Portfolio & Cloud] [04. Walk-Forward] [05. Macro]    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 LAYMAN METRIC TOOLTIP ENGINE (MetricTooltip)               │
├────────────────────────────────────────────────────────────────────────────┤
│ • Realized 30D Volatility -> "Seberapa liar naik-turunnya IHSG 30 hari..." │
│ • Macro Stress Score      -> "Skor tekanan ekonomi dari kurs Rp & bunga"   │
│ • Rebalancing Buffer 40%  -> "Batas aman hemat komisi broker BEI..."       │
│ • Estimasi OOS Net Sharpe -> "Perbandingan potensi cuan vs risiko..."      │
│ • Keranjang 1 vs 2        -> "Pelindung Nilai Tenang vs Akselerasi Cuan"   │
│ • Low-Vol, Mom, Value, β  -> "Ketenangan, Tren Naik, Harga Wajar, Kepekaan"│
└────────────────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **Header & Sub-Navigation**: Memindahkan seluruh tombol tab ke baris kedua di bawah header utama dan menyatukan tombol pengubah tema (*Daylight/Dark Mode*) agar area atas lebih ringkas.
  - **MetricTooltip Integration**: Memasang kamus bahasa awam pada **MarketRegimeBanner**, **BarbellAllocatorCard**, **ScreeningTable**, dan **ActivePortfolioManager**.
