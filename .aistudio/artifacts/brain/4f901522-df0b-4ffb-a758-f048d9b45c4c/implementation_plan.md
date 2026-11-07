# Rencana Implementasi (Revisi): Perbaikan Error 404 `nostradamus/static-market-snapshot.json` & `api/news/rss` serta Sinkronisasi Penuh Harga Seluruh Emiten BEI (.JK)

## 1. Analisis Log Error Konsol Browser yang Anda Kirimkan

Dari log konsol browser:
```text
nostradamus/static-market-snapshot.json?v=29900313:1  Failed to load resource: the server responded with a status of 404 ()
api/news/rss:1  Failed to load resource: the server responded with a status of 404 ()
```

**Penyebab Pasti Kedua Masalah (Error 404 & Harga Emiten Belum Terupdate):**
1. **Mengapa `nostradamus/static-market-snapshot.json` Error 404 & Harga Emiten Tidak Terupdate?**
   - Saat GitHub Pages melayani aplikasi dari root repository (`/nostradamus/`), browser meminta `./static-market-snapshot.json`, yang diterjemahkan menjadi `/nostradamus/static-market-snapshot.json` di root repo. Sebelumnya file tersebut hanya disimpan di `/public/` dan `/docs/`, belum disalin ke root `/static-market-snapshot.json` maupun di-bundle langsung ke dalam `app.js`.
   - Karena file snapshot gagal dimuat (404), seluruh emiten di Screener dan Keranjang gagal membaca data harga Yahoo Finance terbaru dan tertahan di harga awal (`approxPrice`).
   - Selain itu, script generator sebelumnya baru menarik 134 simbol pertama, belum seluruh emiten BEI (`.JK`).
2. **Mengapa `api/news/rss` Error 404?**
   - Fungsi pendeteksi environment statis sebelumnya hanya mengecek beberapa akhiran domain dan belum membatasi pemanggilan `/api/*` secara ketat hanya untuk server lokal/Cloud Run (`localhost` / `.run.app`), serta bundle `docs/assets/app.js` perlu di-build ulang setelah perubahan.

---

## 2. Solusi Permanen yang Akan Diimplementasikan

### A. Zero-404 Bundled + Multi-Path Snapshot (`src/data/staticMarketSnapshot.json` & `/static-market-snapshot.json`)
1. **Direct Module Embedding (`src/data/staticMarketSnapshot.json`)**:
   - Menyimpan hasil sinkronisasi harga seluruh emiten BEI (`.JK`) dan berita RSS langsung ke `src/data/staticMarketSnapshot.json` yang di-import langsung ke dalam kode TypeScript (`liveMarketFetcher.ts`), sekaligus menyalinnya ke `/static-market-snapshot.json` (root), `/public/static-market-snapshot.json`, dan `/docs/static-market-snapshot.json`.
   - Dengan arsitektur ini, **data harga seluruh emiten BEI langsung tersedia 100% di dalam memori `app.js` sejak detik pertama halaman dibuka tanpa bergantung pada request file eksternal yang berisiko 404**.
2. **Strict API Guard (`canUseLocalExpressBackend()`)**:
   - Memastikan endpoint `/api/news/rss`, `/api/yahoo/spark`, dan `/api/yahoo/chart` **HANYA** dipanggil apabila aplikasi berjalan di server Express (`window.location.hostname === 'localhost'` atau `.run.app`).
   - Saat dibuka di GitHub Pages (`*.github.io` atau path `/nostradamus/`), browser **tidak akan pernah memanggil `/api/news/rss` atau URL yang tidak ada**, sehingga konsol browser 100% bersih dari error 404.

### B. Sinkronisasi Penuh Harga Riil Seluruh Emiten BEI (`.JK`) di Screener & Keranjang
1. **Verifikasi & Penarikan Batch Seluruh Emiten BEI (`.JK`) dari Yahoo Finance**:
   - Memperbarui `src/data/idxAllEmitenCatalog.ts` dan `scripts/generate-static-market-bundle.mjs` agar memverifikasi dan menarik harga pasar riil (`lastPrice`, `change1D`, `return30D`, `closes`, `beta1Y`, `volatilityAnn`) untuk **seluruh emiten BEI (`.JK`) yang aktif di Yahoo Finance** tanpa batas `slice(0, 120)`.
   - Setiap emiten di Screener dan Keranjang 1 & 2 langsung diinisialisasi menggunakan harga penutupan dan persentase perubahan (`1D` & `30D`) riil dari Yahoo Finance.
2. **Rebuild Penuh `/docs` & Root Assets**:
   - Menjalankan generator snapshot penuh dan mem-build ulang `docs/` serta menyalin `static-market-snapshot.json` ke root `/` agar saat Anda melakukan `git push`, GitHub Pages langsung menampilkan harga terbaru seluruh emiten tanpa satu pun error 404 di konsol.
