# Perbaikan Trigger GitHub Actions (`se-6108/nostradamus`), Penarikan Ticker `MKNT.JK`, Penyejajaran Lebar Header–Konten–Footer, & Teks Footer Baru

Rencana ini mencakup empat pembaruan utama:
1. **Penyejajaran Batas Lebar Header, Konten & Sticky Footer**: Menyatukan garis batas kiri-kanan **Header**, **Menu Bar**, **Global Macro Wire**, dan **Sticky Footer** agar 100% sejajar dengan kotak **Konten Utama** (`max-w-6xl mx-auto px-4 sm:px-6`).
2. **Pembaruan Teks Sticky Footer**: Menghapus tautan *"Dokumentasi & GitHub Actions"* dari footer serta mengubah bagian kanan footer menjadi **"Made with 💓 by Fayadh"** lengkap dengan animasi detak jantung (*beating heart* `animate-pulse` / `heartbeat`).
3. **Perbaikan Trigger GitHub Actions (`se-6108/nostradamus`)**: Mendeteksi dan memicu workflow `deploy-pages.yml` & `sync-idx-market.yml` secara otomatis dengan proteksi `try / catch` agar bebas dari error `404` maupun `Uncaught (in promise)`.
4. **Dukungan Katalog & Penarikan Manual `MKNT.JK` (Rp 32 — `ILLIQUID`)**: Memasukkan `MKNT` ke katalog Screener sebagai `ILLIQUID` serta mendukung penarikan manual saham berstatus *"Volume Not Available"* di Yahoo Finance.

---

### User Review & Keputusan Terkonfirmasi

> [!IMPORTANT]
> Seluruh preferensi dan revisi tampilan Anda telah dimasukkan ke dalam rancangan ini:

- **Keputusan Terkonfirmasi 1 (Desain & Teks Sticky Footer Baru + Lebar Sejajar)**:
  - Batas lebar kiri dan kanan **Header**, **Global Macro Wire**, dan **Sticky Footer** disejajarkan persis dengan lebar **Konten Utama**.
  - Menghapus tulisan/tombol *"Dokumentasi & GitHub Actions"* pada footer.
  - Mengganti *"© 2026 · Credit: Fayadh"* di sisi kanan footer menjadi **"Made with 💓 by Fayadh"** dengan efek detak jantung berdetak (*beating heart animation*).
- **Keputusan Terkonfirmasi 2 (Penanganan Emiten FCA/Stagnan seperti `MKNT` Rp 32)**:
  - Memasukkan **`MKNT` (PT Mitra Komunikasi Nusantara Tbk — Rp 32, 0.00%)** langsung ke katalog bawaan Screener dengan status **`ILLIQUID`** (otomatis diblokir dari Keranjang 1 & 2).
  - Memperbarui mesin penarik manual (**"Tarik Ticker .JK"**) agar mendukung pembacaan `meta.regularMarketPrice` dari endpoint `/v8/finance/chart/{ticker}.JK` ketika Yahoo Finance mengembalikan *"Volume Not Available"*.
- **Keputusan Terkonfirmasi 3 (Otomasi Trigger GitHub Actions di `se-6108/nostradamus`)**:
  - Mengisi default otomatis **`owner: 'se-6108'`** dan **`repo: 'nostradamus'`**.
  - Menambahkan file workflow `.github/workflows/sync-idx-market.yml` sekaligus membuat fungsi **Trigger Server Sync** mendeteksi daftar workflow aktif di `se-6108/nostradamus` (`deploy-pages.yml` dan `sync-idx-market.yml`) lalu memicu eksekusinya tanpa error konsol.

---

### 1. Tata Letak Sejajar Header, Konten Utama, dan Sticky Footer Baru

```
                ◄─────────────── max-w-6xl mx-auto px-4 sm:px-6 ───────────────►
                ┌──────────────────────────────────────────────────────────────┐
STICKY HEADER   │ [Logo] NOSTRADAMUS QUANT         [Sync Semua] [GitHub Cloud] │
& 5-TAB MENU    ├──────────────────────────────────────────────────────────────┤
                │ [01. Command] [02. Screener] [03. Portfolio] [04. Audit] ... │
                ├──────────────────────────────────────────────────────────────┤
MACRO WIRE      │ GLOBAL MACRO WIRE // USD/IDR · DXY · US10Y · VIX · BRENT ... │
                └──────────────────────────────────────────────────────────────┘
                │                       (Garis Batas Kiri & Kanan Sejajar)     │
                ┌──────────────────────────────────────────────────────────────┐
SUB-TOOLBAR     │ Sentimen Pasar: VOLATIL · 956/956 Emiten JCI   [Theme Mode]  │
                └──────────────────────────────────────────────────────────────┘
                ┌──────────────────────────────────────────────────────────────┐
KONTEN UTAMA    │                                                              │
(CARDS & TABLE) │   Kartu Alokator / Tabel Screener / Portofolio Aktif         │
                │   (Lebar kotak 100% sejajar dengan Header & Footer)          │
                │                                                              │
                └──────────────────────────────────────────────────────────────┘
                │                       (Garis Batas Kiri & Kanan Sejajar)     │
                ┌──────────────────────────────────────────────────────────────┐
STICKY FOOTER   │ © 2026 Nostradamus Quant Terminal     Made with 💓 by Fayadh │
                └──────────────────────────────────────────────────────────────┘
```

---

### 2. Perbaikan Teknis `MKNT.JK` & Trigger GitHub Actions

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. PENARIKAN TICKER MANUAL ("Tarik Ticker .JK" — Contoh: MKNT)               │
│                                                                              │
│ Input "MKNT" ──► Cek Express / Browser CORS (/v8/finance/chart/MKNT.JK)      │
│              ──► Baca meta.regularMarketPrice (Rp 32) meski Volume N/A       │
│              ──► Fallback ke Katalog/Snapshot jika jaringan diblokir         │
│              ──► Tandai isLiquid = false (ILLIQUID) & Blokir Keranjang 1 & 2 │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 2. TRIGGER SERVER SYNC GITHUB ACTIONS (se-6108/nostradamus)                  │
│                                                                              │
│ Klik "Trigger Server Sync"                                                   │
│   ├─► GET /repos/se-6108/nostradamus/actions/workflows                       │
│   ├─► Temukan ID workflow aktif (deploy-pages.yml & sync-idx-market.yml)     │
│   ├─► POST /repos/se-6108/nostradamus/actions/workflows/{id}/dispatches      │
│   └─► Tangani semua respons di dalam try/catch (Bebas Uncaught Error)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Rincian Implementasi

1. **Penyejajaran Kontainer & Sticky Footer Baru (`Header`, `GlobalMacroPulse`, `Main`, dan `Footer`)**:
   - Menyelaraskan lebar kontainer `Header` + `GlobalMacroPulse` (sticky di atas), `Main Content`, dan `Footer` (sticky di bawah) agar seluruhnya berada di dalam batas kolom `max-w-6xl w-full mx-auto px-4 sm:px-6` yang sejajar lurus dari atas ke bawah.
   - Menghapus tombol *"Dokumentasi & GitHub Actions"* dari footer, menampilkan `© 2026 Nostradamus Quant Terminal` di sisi kiri, dan menampilkan **`Made with 💓 by Fayadh`** dengan animasi detak jantung (`animate-heartbeat`) di sisi kanan.
2. **Dukungan Penuh Emiten FCA/Stagnan (`MKNT.JK` Rp 32)**:
   - Menambahkan `MKNT` (*PT Mitra Komunikasi Nusantara Tbk*, Rp 32, `0.00%`, `isLiquid: false`) ke katalog BEI dan snapshot statis sehingga langsung tampil di Screener sebagai `ILLIQUID`.
   - Memperbaiki `fetchYahooSparkBatch` dan `fetchYahooChartSeries` agar pencarian manual 1 ticker selalu memanggil `/v8/finance/chart/{symbol}` dan mengekstrak `meta.regularMarketPrice` meskipun saham berstatus *"Volume Not Available"*.
3. **Otomasi GitHub Actions (`se-6108/nostradamus`) & Proteksi Error Konsol**:
   - Mengatur default konfigurasi GitHub Cloud ke `owner: 'se-6108'` dan `repo: 'nostradamus'`.
   - Menambahkan file `.github/workflows/sync-idx-market.yml` serta memperbarui `triggerGitHubActionsMarketSync` agar mendeteksi dan memicu `deploy-pages.yml` & `sync-idx-market.yml` secara otomatis dengan penanganan `try / catch` penuh.
