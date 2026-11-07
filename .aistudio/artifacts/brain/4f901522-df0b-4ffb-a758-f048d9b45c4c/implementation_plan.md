# Rencana Implementasi: Portabilitas Repo, Struktur Biaya Stockbit & Buffer 40%, UI/UX Portofolio, dan Kalibrasi Volatilitas BEI

## 1. Portabilitas Multi-User saat Repo Di-Copy / Fork (Tanpa Hardcode Default `se-6108`)
- **Jawaban Teknis**: Sistem ini **100% aman dan siap diadopsi publik** oleh siapa pun yang melakukan *fork* atau *copy* repository.
- **Perubahan (`src/utils/githubCloudSync.ts` & `src/components/GitHubCloudSyncModal.tsx`)**:
  - Menghapus fallback hardcode `'se-6108'` pada `detectDefaultGitHubRepoInfo()`.
  - Jika aplikasi dibuka melalui domain GitHub Pages (`https://<username>.github.io/<repo>/`), sistem **mendeteksi otomatis** `<username>` dan `<repo>` dari URL pemilik masing-masing.
  - Jika dibuka di domain kustom atau lokal dan belum pernah dikonfigurasi, kolom **GitHub Username / Owner** dibiarkan kosong (`""`) dengan placeholder contoh, sehingga pengguna baru cukup mengisi Username GitHub dan Token PAT mereka sendiri di browser masing-masing (tersimpan privat di `localStorage` perangkat pengguna tersebut).

## 2. Format Timestamp `Update:` Lengkap dengan Tanggal & Pukul Jam:Menit:Detik WIB (Lampiran 1)
- **Perubahan (`src/components/ActivePortfolioManager.tsx` & `src/App.tsx`)**:
  - Memperbarui indikator `Update:` di sebelah tombol `Export .JSON` / `Import .JSON` / `Reset` pada Tab 03 agar selalu menampilkan **Hari, Tanggal Bulan Tahun + Pukul Jam:Menit:Detik WIB** (contoh: `Update: Sabtu, 7 November 2026 · Pukul 12:41:11 WIB`).
  - Memastikan setiap aksi *Refresh Live*, *Tambah/Edit/Hapus Lot*, *Ubah Kas*, maupun *Pull/Push GitHub Cloud* memperbarui cap waktu lengkap tersebut.

## 3. Penyesuaian Biaya Transaksi **Stockbit Sekuritas** & Kaitannya dengan **40% Rebalancing Buffer** (Lampiran 2)
- **Struktur Resmi Biaya Stockbit Sekuritas**:
  - **Fee Pembelian (Buy)**: **`0,15%`** dari nilai transaksi (sudah termasuk PPN & *levy* BEI/KPEI/KSEI).
  - **Fee Penjualan (Sell)**: **`0,25%`** dari nilai transaksi (sudah termasuk PPN, *levy* bursa, dan PPh Final `0,1%`).
  - **Total Biaya *Round-Trip* (Beli + Jual Saham)**: **`0,40%` (`40 bps`)**.
  - **Fee ETF, Right, dan Waran**: Beli `0,15%`, Jual `0,15%` (tanpa PPh Final), dan *Exercise* (penebusan) Right/Waran = **`Rp 0` (bebas fee)**.
  - **Bea Materai**: **`Rp 10.000`** per hari bursa apabila total nilai *Trade Confirmation* (TC) harian (akumulasi beli + jual hari tersebut) melebihi **`Rp 10.000.000`**.
  - **Biaya Live Datafeed**: Dikenakan apabila total nilai transaksi bulanan (jual + beli) berada di kisaran **`Rp 20.000.000 – Rp 100.000.000`**.
- **Hubungan Kuantitatif dengan Konsep 40% No-Trade Rebalancing Buffer**:
  1. **Meredam Friksi *Round-Trip* `0,40%` (`0,15%` Beli + `0,25%` Jual)**: Tanpa *buffer*, setiap fluktuasi harga harian sebesar 1%–5% akan memicu jual-beli mikro yang langsung menggerus *alpha* sebesar `0,40%` per putaran. Dengan **ZonaToleransi ±40%** dari target lot ideal ($\text{Lot Ideal} \times [0,60 \dots 1,40]$), posisi yang bergeser tipis akibat *noise* pasar akan berstatus **`HOLD (DALAM BUFFER)`** sehingga bebas biaya broker dan pajak PPh Final.
  2. **Menghindari Bea Materai Harian `Rp 10.000` (TC > Rp 10 Juta)**: Jika *rebalancing* dilakukan terlalu sering dalam ukuran tanggung, investor berisiko terkena Bea Materai `Rp 10.000` berkali-kali setiap terbit *Trade Confirmation* harian di atas Rp 10 juta. *Buffer* 40% menahan eksekusi hingga deviasi bobot benar-benar signifikan, sehingga eksekusi dapat dikonsolidasikan dalam satu hari bursa (cukup 1x TC).
- **Perubahan (`src/components/ActivePortfolioManager.tsx` & `src/components/MarketRegimeBanner.tsx`)**:
  - Memperbarui kalkulasi friksi transaksi dari estimasi generik menjadi presisi **Stockbit Sekuritas (`0,15% Beli / 0,25% Jual = 0,40% Round-Trip` + kalkulator dampak Bea Materai Rp 10.000 jika TC > Rp 10 juta)**.
  - Menambahkan kartu ringkas **Rincian Friksi Stockbit Sekuritas & Penghematan 40% Buffer** di Tab 03 dan memperbarui penjelasan di Tab 01.

## 4. Penggantian Emoji Footer Menjadi Api Berkobar (`🔥`)
- **Perubahan (`src/App.tsx` & `src/index.css`)**:
  - Mengubah kredit footer dari `Made with 💓 by Fayadh` menjadi **`Made with 🔥 by Fayadh`** lengkap dengan animasi CSS nyala api halus (`.animate-flame`).

## 5. Searchable Dropdown Combobox pada "Pilih Saham Screener" di Portofolio
- **Perubahan (`src/components/ActivePortfolioManager.tsx`)**:
  - Mengganti elemen `<select>` standar dan input teks terpisah menjadi satu komponen **Searchable Dropdown Combobox (`Pilih / Ketik Saham Screener .JK`)**.
  - Pengguna dapat langsung mengetik kode *ticker* (misal `BBCA`, `MKNT`, `BMRI`), nama perusahaan, atau sektor, melihat daftar saham yang terfilter secara instan beserta harga live dan skor QMJ, atau mengetik kode emiten BEI apa pun lalu menekan pilih.

## 6. Menghilangkan Popup "Save Password?" Browser pada Input Token PAT GitHub (Lampiran 3)
- **Penyebab Teknis**: Browser Chromium (Chrome/Edge/Brave) mendeteksi elemen `<form>` yang memiliki kombinasi `<input type="text">` (Username) dan `<input type="password">` (PAT Token), sehingga saat tombol *Simpan* atau *Tutup* ditekan, *Google Password Manager* menganggap pengguna sedang melakukan *login* akun dan menawarkan penyimpanan *password*.
- **Perubahan (`src/components/GitHubCloudSyncModal.tsx`)**:
  - Mengganti wrapper `<form>` menjadi `<div>` dengan *handler* tombol langsung.
  - Mengubah kolom PAT Token dari `type="password"` menjadi `type="text"` yang disamarkan menggunakan properti CSS `-webkit-text-security: disc` (tetap tampil bulat-bulat tersembunyi di layar, dilengkapi tombol ikon Mata *Show/Hide*), serta atribut `autoComplete="off"`, `data-1p-ignore="true"`, dan `data-lpignore="true"`. Dengan teknik ini, *Password Manager* browser **tidak akan pernah muncul lagi**.

## 7. Sinkronisasi Otomatis Modal Portofolio & Cadangan Kas (Aktual dari Cache & GitHub Cloud)
- **Jawaban Teknis & Perubahan (`src/App.tsx` & `data/nostradamus_cloud_state.json`)**:
  - Nilai **Portofolio Saham (`holdings`)** dan **Cadangan Kas (`cashReserveIdr`)** diambil langsung dari **kondisi aktual** di Cache (`localStorage`) dan disinkronkan dua arah dengan file `/data/nostradamus_cloud_state.json` di GitHub Cloud Anda.
  - Apabila browser baru pertama kali dibuka (cache kosong), aplikasi menginisialisasi data dari snapshot `/data/nostradamus_cloud_state.json` aktual di repositori (serta menarik *state* terbaru dari GitHub API bila tersedia).
  - Nilai **Modal Alokator (`capitalIdr`)** di Tab 01 disinkronkan otomatis agar selalu mencerminkan **Total Nilai Pasar Saham Aktual + Cadangan Kas Aktual** (`totalPortfolioMarketValue + cashReserveIdr`) saat portofolio atau kas berubah, sekaligus menyediakan tombol 1-klik **"Samakan dengan NAV Aktual Portofolio + Kas"**.

## 8. Perubahan Diksi `"Arti Awam:"` Menjadi `"Definisi :"`
- **Perubahan (`src/components/MetricTooltip.tsx` & `src/components/MarketRegimeBanner.tsx`)**:
  - Mengganti label `"Arti Awam:"` pada seluruh popup *tooltip* kamus indikator menjadi **`"Definisi :"`**.

## 9. Mengapa Target Volatilitas Tahunan ($c$) Sebelumnya Mentok di `26%` & Perluasan ke `8%–60%`
- **Penjelasan Kuantitatif**: Batas `26%` sebelumnya mengacu pada standar *Volatility Targeting* di indeks saham negara maju (seperti S&P 500 yang rata-rata volatilitas tahunannya ~15%–20%). Namun, di pasar negara berkembang seperti **Bursa Efek Indonesia (BEI / IHSG)**—terutama pada saham komoditas, energi, dan *second-liner*—volatilitas tahunan ($\sigma_{\text{annual}}$) kerap berada di kisaran **`28%` hingga `55%`**. Jika $c$ dibatasi maksimal `26%`, maka rasio $c / \sigma_t$ akan terlalu konservatif pada saham BEI ber-beta tinggi.
- **Perubahan (`src/components/MarketRegimeBanner.tsx`)**:
  - Memperluas rentang slider **Target Volatilitas Tahunan ($c$)** dari `12%–26%` menjadi **`8%` hingga `60%`** dan menambahkan **kotak input angka manual (`%`)** di samping slider agar Anda bebas menentukan konstanta $c$ secara presisi sesuai profil risiko pasar Indonesia.
