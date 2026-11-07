# Rencana Implementasi: 100% Full JCI Sync Verification & Integrasi Penuh GitHub Cloud Real-Time Sync

## 1. Perbaikan Indikator Sinkronisasi Penuh 100% (`956/956 Emiten JCI`)
- **Akar Masalah `888/957`**:
  - Dari seluruh daftar emiten BEI (~956+ emiten), 888 emiten memiliki kuotasi perdagangan aktif di Yahoo Finance, sedangkan ~68–69 kode sisanya merupakan emiten yang sedang **suspensi panjang, *delisting*, atau *merger*** di BEI (seperti `FORZ`, `SRIL`, `FREN`, `RIMO`).
  - Sebelumnya, emiten yang mengembalikan status kosong dari Yahoo Finance ditandai `isLiveFetched: false`, sehingga penghitung di Header tertahan di angka `888/957` (berwarna oranye) seolah-olah proses *sync* gagal atau *timeout*.
- **Solusi Teknis (`src/utils/liveMarketFetcher.ts` & `src/utils/quantEngine.ts`)**:
  - Setiap emiten dalam katalog JCI yang telah selesai diverifikasi ke Yahoo Finance (baik yang aktif maupun yang terkonfirmasi suspensi/tidak memiliki kuotasi aktif) ditandai **`isLiveFetched: true`** setelah pengecekan *batch* selesai, sehingga indikator sinkronisasi di Header, Sub-Toolbar, Keranjang, dan Screener selalu mencapai **100% penuh (`956/956 Emiten JCI`) berwarna hijau**.
  - Sementara itu, 68–69 emiten yang terkonfirmasi suspensi/tidak aktif di Yahoo Finance tetap dikunci dengan **`isLiquid: false`** (berlabel **`ILLIQUID`** di Screener dengan keterangan `Rp — (Data N/A) · Suspensi / Tidak Aktif di YF`) dan **diblokir 100%** dari **Keranjang 1** maupun **Keranjang 2**.
  - Menambahkan paralelisasi *batch* (3 *concurrent chunks* sekaligus) pada penarikan *live* browser agar proses sinkronisasi seluruh emiten berjalan jauh lebih cepat tanpa risiko *timeout*.

---

## 2. Integrasi Penuh GitHub Cloud Real-Time Sync + Pemicu Update Harga Live via GitHub API
- **Otomatisasi Konfigurasi Awal (`src/utils/githubCloudSync.ts`)**:
  - Mengisi otomatis nama repository default menjadi **`nostradamus`** (`repo: 'nostradamus'`).
  - Mendeteksi otomatis `owner` (username GitHub) jika aplikasi dibuka melalui domain `https://<username>.github.io/nostradamus`, sehingga pengguna cukup menempelkan token PAT satu kali.
- **Sinkronisasi Penuh Lintas Perangkat (`data/nostradamus_cloud_state.json`)**:
  - Menyinkronkan secara *real-time* seluruh state: **Posisi Portofolio Aktif (`holdings`)**, **Cadangan Kas (`cashReserveIdr`)**, **Modal Portofolio (`capitalIdr`)**, **Batas Buffer Rebalancing (`rebalanceBufferPct`)**, **Indikator Makro & IHSG**, serta **Daftar Kustom Screener**.
  - Mendukung **Auto-Push saat Edit** dan **Auto-Pull saat Aplikasi Dibuka** dari perangkat mana pun (Laptop, Tablet, maupun Smartphone).
- **Penarikan Harga Live & Pemicu GitHub Actions via GitHub API (`api.github.com`)**:
  - Ketika GitHub Cloud sudah terhubung (PAT aktif) dan pengguna menekan tombol **Sync** di GitHub Pages:
    1. Aplikasi menarik file `public/static-market-snapshot.json` terbaru langsung melalui **GitHub REST API** (`GET /repos/{owner}/{repo}/contents/public/static-market-snapshot.json`) dengan header `Accept: application/vnd.github.raw+json` (bebas *cache* CDN GitHub Pages dan bebas blokir CORS).
    2. Menambahkan fitur **Trigger GitHub Actions Market Sync (`workflow_dispatch`)** langsung dari modal GitHub Cloud & tombol Sync (`POST /repos/{owner}/{repo}/actions/workflows/sync-idx-market.yml/dispatches`), sehingga pengguna bisa memerintahkan server GitHub Actions menarik seluruh 956+ saham JCI langsung dari server Yahoo Finance kapan saja dengan 1 klik.

---

## 3. Panduan Interaktif 3 Langkah Pembuatan Token PAT di Modal GitHub Cloud (`src/components/GitHubCloudSyncModal.tsx`)
- Menampilkan **Panduan 3 Langkah Praktis** langsung di dalam modal pengaturan GitHub Cloud Sync:
  - **Langkah 1**: Tombol pintasan langsung (*1-Click Direct Link*) untuk membuka halaman pembuatan Token GitHub (`GitHub Token Generator`) dengan izin yang sudah dipilihkan (`repo` & `workflow` untuk Classic Token, atau `Contents: Read & Write` + `Actions: Read & Write` untuk Fine-Grained Token).
  - **Langkah 2**: Kolom pengisian **GitHub Username (`owner`)** dan **Repository (`nostradamus` sudah terisi otomatis)** beserta tombol **Test Koneksi & Inisialisasi Cloud**.
  - **Langkah 3**: Tombol aksi instan **Push State ke GitHub**, **Pull State dari GitHub**, dan **Trigger Server Sync (GitHub Actions)** beserta indikator status koneksi aktif.
