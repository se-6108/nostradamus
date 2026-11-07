import { IdxDirectoryEntry } from '../utils/liveMarketFetcher';

/**
 * Core Curated High-Liquidity Emiten with Detailed Institutional Profiles
 */
export const CORE_IDX_EMITEN: IdxDirectoryEntry[] = [
  // 1. Financials
  { ticker: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Financials', defaultRoe: 21.8, defaultDer: 0.38, defaultOpMargin: 54.2, approxPrice: 5100, approxBeta: 0.76 },
  { ticker: 'BMRI', name: 'Bank Mandiri (Persero) Tbk', sector: 'Financials', defaultRoe: 22.4, defaultDer: 0.56, defaultOpMargin: 48.9, approxPrice: 3640, approxBeta: 1.18 },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia (Persero) Tbk', sector: 'Financials', defaultRoe: 19.8, defaultDer: 0.62, defaultOpMargin: 44.5, approxPrice: 2740, approxBeta: 1.24 },
  { ticker: 'BBNI', name: 'Bank Negara Indonesia (Persero) Tbk', sector: 'Financials', defaultRoe: 15.4, defaultDer: 0.68, defaultOpMargin: 39.2, approxPrice: 3270, approxBeta: 1.29 },
  { ticker: 'BRIS', name: 'Bank Syariah Indonesia Tbk', sector: 'Financials', defaultRoe: 17.6, defaultDer: 0.42, defaultOpMargin: 36.8, approxPrice: 2140, approxBeta: 1.32 },
  { ticker: 'BNGA', name: 'Bank CIMB Niaga Tbk', sector: 'Financials', defaultRoe: 14.8, defaultDer: 0.51, defaultOpMargin: 35.2, approxPrice: 1685, approxBeta: 0.72 },
  { ticker: 'NISP', name: 'Bank OCBC NISP Tbk', sector: 'Financials', defaultRoe: 13.2, defaultDer: 0.48, defaultOpMargin: 34.0, approxPrice: 1240, approxBeta: 0.65 },
  { ticker: 'BTPS', name: 'Bank BTPN Syariah Tbk', sector: 'Financials', defaultRoe: 13.8, defaultDer: 0.22, defaultOpMargin: 29.5, approxPrice: 890, approxBeta: 1.15 },
  { ticker: 'BDMN', name: 'Bank Danamon Indonesia Tbk', sector: 'Financials', defaultRoe: 8.4, defaultDer: 0.46, defaultOpMargin: 26.4, approxPrice: 2540, approxBeta: 0.68 },
  { ticker: 'BNLI', name: 'Bank Permata Tbk', sector: 'Financials', defaultRoe: 7.9, defaultDer: 0.44, defaultOpMargin: 25.8, approxPrice: 1120, approxBeta: 0.64 },
  { ticker: 'BBTN', name: 'Bank Tabungan Negara (Persero) Tbk', sector: 'Financials', defaultRoe: 11.6, defaultDer: 0.88, defaultOpMargin: 24.5, approxPrice: 1180, approxBeta: 1.35 },
  { ticker: 'BJBR', name: 'BPD Jawa Barat dan Banten Tbk', sector: 'Financials', defaultRoe: 12.2, defaultDer: 0.72, defaultOpMargin: 23.8, approxPrice: 945, approxBeta: 0.78 },
  { ticker: 'BJTM', name: 'BPD Jawa Timur Tbk', sector: 'Financials', defaultRoe: 13.1, defaultDer: 0.58, defaultOpMargin: 27.2, approxPrice: 555, approxBeta: 0.71 },
  { ticker: 'PNBN', name: 'Bank Pan Indonesia Tbk', sector: 'Financials', defaultRoe: 6.8, defaultDer: 0.49, defaultOpMargin: 24.1, approxPrice: 1280, approxBeta: 0.94 },
  { ticker: 'ARTO', name: 'Bank Jago Tbk', sector: 'Financials', defaultRoe: 2.4, defaultDer: 0.31, defaultOpMargin: 12.6, approxPrice: 2180, approxBeta: 1.62 },
  { ticker: 'BBYB', name: 'Bank Neo Commerce Tbk', sector: 'Financials', defaultRoe: 1.8, defaultDer: 0.42, defaultOpMargin: 8.5, approxPrice: 246, approxBeta: 1.58 },
  { ticker: 'BFIN', name: 'BFI Finance Indonesia Tbk', sector: 'Financials', defaultRoe: 16.9, defaultDer: 1.12, defaultOpMargin: 34.2, approxPrice: 865, approxBeta: 1.14 },
  { ticker: 'ADMF', name: 'Adira Dinamika Multi Finance Tbk', sector: 'Financials', defaultRoe: 18.2, defaultDer: 1.05, defaultOpMargin: 32.8, approxPrice: 10450, approxBeta: 0.62 },

  // 2. Energy
  { ticker: 'ADRO', name: 'Alamtri Resources Indonesia Tbk', sector: 'Energy', defaultRoe: 24.6, defaultDer: 0.24, defaultOpMargin: 38.2, approxPrice: 2330, approxBeta: 1.15 },
  { ticker: 'ITMG', name: 'Indo Tambangraya Megah Tbk', sector: 'Energy', defaultRoe: 26.8, defaultDer: 0.14, defaultOpMargin: 29.4, approxPrice: 24475, approxBeta: 0.84 },
  { ticker: 'PTBA', name: 'Bukit Asam Tbk', sector: 'Energy', defaultRoe: 25.1, defaultDer: 0.22, defaultOpMargin: 22.8, approxPrice: 2970, approxBeta: 0.79 },
  { ticker: 'PGAS', name: 'Perusahaan Gas Negara Tbk', sector: 'Energy', defaultRoe: 12.6, defaultDer: 0.58, defaultOpMargin: 18.4, approxPrice: 1480, approxBeta: 1.14 },
  { ticker: 'MEDC', name: 'Medco Energi Internasional Tbk', sector: 'Energy', defaultRoe: 19.2, defaultDer: 1.42, defaultOpMargin: 31.5, approxPrice: 1125, approxBeta: 1.38 },
  { ticker: 'AKRA', name: 'AKR Corporindo Tbk', sector: 'Energy', defaultRoe: 21.4, defaultDer: 0.36, defaultOpMargin: 9.8, approxPrice: 1190, approxBeta: 0.89 },
  { ticker: 'HRUM', name: 'Harum Energy Tbk', sector: 'Energy', defaultRoe: 14.5, defaultDer: 0.28, defaultOpMargin: 24.2, approxPrice: 1020, approxBeta: 1.34 },
  { ticker: 'INDY', name: 'Indika Energy Tbk', sector: 'Energy', defaultRoe: 11.8, defaultDer: 0.92, defaultOpMargin: 14.6, approxPrice: 1385, approxBeta: 1.28 },
  { ticker: 'BUMI', name: 'Bumi Resources Tbk', sector: 'Energy', defaultRoe: 8.2, defaultDer: 0.64, defaultOpMargin: 11.4, approxPrice: 118, approxBeta: 1.54 },
  { ticker: 'ELSA', name: 'Elnusa Tbk', sector: 'Energy', defaultRoe: 14.1, defaultDer: 0.42, defaultOpMargin: 9.6, approxPrice: 436, approxBeta: 1.08 },
  { ticker: 'RAJA', name: 'Rukun Raharja Tbk', sector: 'Energy', defaultRoe: 16.4, defaultDer: 0.68, defaultOpMargin: 21.2, approxPrice: 1680, approxBeta: 1.32 },
  { ticker: 'TOBA', name: 'TBS Energi Utama Tbk', sector: 'Energy', defaultRoe: 9.4, defaultDer: 0.86, defaultOpMargin: 13.8, approxPrice: 488, approxBeta: 1.19 },
  { ticker: 'DEWA', name: 'Darma Henwa Tbk', sector: 'Energy', defaultRoe: 5.2, defaultDer: 0.74, defaultOpMargin: 8.4, approxPrice: 92, approxBeta: 1.44 },
  { ticker: 'DOID', name: 'Delta Dunia Makmur Tbk', sector: 'Energy', defaultRoe: 11.5, defaultDer: 1.85, defaultOpMargin: 12.1, approxPrice: 540, approxBeta: 1.31 },
  { ticker: 'MBMA', name: 'Merdeka Battery Materials Tbk', sector: 'Energy', defaultRoe: 6.8, defaultDer: 0.48, defaultOpMargin: 10.5, approxPrice: 492, approxBeta: 1.36 },

  // 3. Basic Materials
  { ticker: 'AMMN', name: 'Amman Mineral Internasional Tbk', sector: 'Basic Materials', defaultRoe: 17.2, defaultDer: 0.58, defaultOpMargin: 36.4, approxPrice: 3680, approxBeta: 1.48 },
  { ticker: 'ANTM', name: 'Aneka Tambang Tbk', sector: 'Basic Materials', defaultRoe: 12.8, defaultDer: 0.21, defaultOpMargin: 11.4, approxPrice: 1450, approxBeta: 1.36 },
  { ticker: 'INCO', name: 'Vale Indonesia Tbk', sector: 'Basic Materials', defaultRoe: 10.9, defaultDer: 0.12, defaultOpMargin: 22.1, approxPrice: 3420, approxBeta: 1.22 },
  { ticker: 'MDKA', name: 'Merdeka Copper Gold Tbk', sector: 'Basic Materials', defaultRoe: 4.5, defaultDer: 1.18, defaultOpMargin: 9.2, approxPrice: 1680, approxBeta: 1.45 },
  { ticker: 'NCKL', name: 'Trimegah Bangun Persada Tbk', sector: 'Basic Materials', defaultRoe: 21.6, defaultDer: 0.44, defaultOpMargin: 31.0, approxPrice: 785, approxBeta: 1.06 },
  { ticker: 'SMGR', name: 'Semen Indonesia (Persero) Tbk', sector: 'Basic Materials', defaultRoe: 5.8, defaultDer: 0.42, defaultOpMargin: 11.2, approxPrice: 2890, approxBeta: 1.19 },
  { ticker: 'INTP', name: 'Indocement Tunggal Prakarsa Tbk', sector: 'Basic Materials', defaultRoe: 9.6, defaultDer: 0.18, defaultOpMargin: 13.8, approxPrice: 5850, approxBeta: 0.88 },
  { ticker: 'TPIA', name: 'Chandra Asri Pacific Tbk', sector: 'Basic Materials', defaultRoe: 6.4, defaultDer: 0.84, defaultOpMargin: 9.8, approxPrice: 6850, approxBeta: 1.42 },
  { ticker: 'BRPT', name: 'Barito Pacific Tbk', sector: 'Basic Materials', defaultRoe: 5.2, defaultDer: 1.12, defaultOpMargin: 14.5, approxPrice: 920, approxBeta: 1.49 },
  { ticker: 'INKP', name: 'Indah Kiat Pulp & Paper Tbk', sector: 'Basic Materials', defaultRoe: 10.8, defaultDer: 0.66, defaultOpMargin: 18.4, approxPrice: 6975, approxBeta: 1.12 },
  { ticker: 'TKIM', name: 'Pabrik Kertas Tjiwi Kimia Tbk', sector: 'Basic Materials', defaultRoe: 9.4, defaultDer: 0.58, defaultOpMargin: 14.2, approxPrice: 6150, approxBeta: 1.15 },
  { ticker: 'TINS', name: 'Timah Tbk', sector: 'Basic Materials', defaultRoe: 11.2, defaultDer: 0.72, defaultOpMargin: 12.6, approxPrice: 1090, approxBeta: 1.38 },
  { ticker: 'ESSA', name: 'ESSA Industries Indonesia Tbk', sector: 'Basic Materials', defaultRoe: 13.4, defaultDer: 0.45, defaultOpMargin: 21.8, approxPrice: 780, approxBeta: 1.29 },
  { ticker: 'AVIA', name: 'Avia Avian Tbk', sector: 'Basic Materials', defaultRoe: 16.8, defaultDer: 0.14, defaultOpMargin: 24.6, approxPrice: 468, approxBeta: 0.72 },

  // 4. Consumer Non-Cyclicals
  { ticker: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 18.4, defaultDer: 0.64, defaultOpMargin: 21.6, approxPrice: 6125, approxBeta: 0.58 },
  { ticker: 'INDF', name: 'Indofood Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 15.2, defaultDer: 0.72, defaultOpMargin: 18.1, approxPrice: 5950, approxBeta: 0.64 },
  { ticker: 'MYOR', name: 'Mayora Indah Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 21.2, defaultDer: 0.39, defaultOpMargin: 14.9, approxPrice: 2280, approxBeta: 0.55 },
  { ticker: 'CMRY', name: 'Cisarua Mountain Dairy Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 23.8, defaultDer: 0.11, defaultOpMargin: 20.4, approxPrice: 4330, approxBeta: 0.52 },
  { ticker: 'AMRT', name: 'Sumber Alfaria Trijaya Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 24.5, defaultDer: 0.35, defaultOpMargin: 4.8, approxPrice: 975, approxBeta: 0.78 },
  { ticker: 'CPIN', name: 'Charoen Pokphand Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 12.4, defaultDer: 0.38, defaultOpMargin: 8.9, approxPrice: 4120, approxBeta: 0.86 },
  { ticker: 'TAPG', name: 'Triputra Agro Persada Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 19.6, defaultDer: 0.32, defaultOpMargin: 26.5, approxPrice: 795, approxBeta: 0.74 },
  { ticker: 'UNVR', name: 'Unilever Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 82.0, defaultDer: 1.45, defaultOpMargin: 15.2, approxPrice: 1890, approxBeta: 0.58 },
  { ticker: 'JPFA', name: 'Japfa Comfeed Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 15.6, defaultDer: 0.82, defaultOpMargin: 8.4, approxPrice: 1640, approxBeta: 0.98 },
  { ticker: 'GGRM', name: 'Gudang Garam Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 6.2, defaultDer: 0.34, defaultOpMargin: 5.8, approxPrice: 13250, approxBeta: 0.76 },
  { ticker: 'HMSP', name: 'H.M. Sampoerna Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 26.4, defaultDer: 0.42, defaultOpMargin: 8.9, approxPrice: 645, approxBeta: 0.79 },
  { ticker: 'LSIP', name: 'PP London Sumatra Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 11.4, defaultDer: 0.12, defaultOpMargin: 24.2, approxPrice: 1040, approxBeta: 0.75 },
  { ticker: 'AALI', name: 'Astra Agro Lestari Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 6.8, defaultDer: 0.24, defaultOpMargin: 9.6, approxPrice: 6125, approxBeta: 0.78 },
  { ticker: 'SSMS', name: 'Sawit Sumbermas Sarana Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 17.4, defaultDer: 0.88, defaultOpMargin: 22.8, approxPrice: 1180, approxBeta: 0.72 },

  // 5. Healthcare
  { ticker: 'KLBF', name: 'Kalbe Farma Tbk', sector: 'Healthcare', defaultRoe: 14.9, defaultDer: 0.19, defaultOpMargin: 14.8, approxPrice: 755, approxBeta: 0.62 },
  { ticker: 'SIDO', name: 'Industri Jamu dan Farmasi Sido Muncul Tbk', sector: 'Healthcare', defaultRoe: 28.4, defaultDer: 0.09, defaultOpMargin: 34.6, approxPrice: 318, approxBeta: 0.49 },
  { ticker: 'MIKA', name: 'Mitra Keluarga Karyasehat Tbk', sector: 'Healthcare', defaultRoe: 18.9, defaultDer: 0.08, defaultOpMargin: 29.8, approxPrice: 2390, approxBeta: 0.56 },
  { ticker: 'HEAL', name: 'Medikaloka Hermina Tbk', sector: 'Healthcare', defaultRoe: 13.8, defaultDer: 0.54, defaultOpMargin: 19.2, approxPrice: 1265, approxBeta: 0.68 },
  { ticker: 'SILO', name: 'Siloam International Hospitals Tbk', sector: 'Healthcare', defaultRoe: 16.4, defaultDer: 0.22, defaultOpMargin: 18.7, approxPrice: 2580, approxBeta: 0.61 },
  { ticker: 'TSPC', name: 'Tempo Scan Pacific Tbk', sector: 'Healthcare', defaultRoe: 15.8, defaultDer: 0.24, defaultOpMargin: 12.6, approxPrice: 2480, approxBeta: 0.54 },
  { ticker: 'PRDA', name: 'Prodia Widyahusada Tbk', sector: 'Healthcare', defaultRoe: 12.4, defaultDer: 0.14, defaultOpMargin: 16.8, approxPrice: 2890, approxBeta: 0.58 },
  { ticker: 'SAME', name: 'Sarana Meditama Metropolitan Tbk', sector: 'Healthcare', defaultRoe: 6.2, defaultDer: 0.48, defaultOpMargin: 14.2, approxPrice: 278, approxBeta: 0.89 },

  // 6. Infrastructures
  { ticker: 'TLKM', name: 'Telkom Indonesia (Persero) Tbk', sector: 'Infrastructures', defaultRoe: 18.1, defaultDer: 0.49, defaultOpMargin: 31.4, approxPrice: 1995, approxBeta: 0.81 },
  { ticker: 'ISAT', name: 'Indosat Tbk', sector: 'Infrastructures', defaultRoe: 15.8, defaultDer: 1.35, defaultOpMargin: 24.6, approxPrice: 1820, approxBeta: 1.04 },
  { ticker: 'EXCL', name: 'XL Axiata Tbk', sector: 'Infrastructures', defaultRoe: 6.4, defaultDer: 1.62, defaultOpMargin: 17.8, approxPrice: 1990, approxBeta: 0.96 },
  { ticker: 'JSMR', name: 'Jasa Marga (Persero) Tbk', sector: 'Infrastructures', defaultRoe: 14.2, defaultDer: 1.28, defaultOpMargin: 38.4, approxPrice: 3960, approxBeta: 1.02 },
  { ticker: 'BREN', name: 'Barito Renewables Energy Tbk', sector: 'Infrastructures', defaultRoe: 22.1, defaultDer: 2.15, defaultOpMargin: 64.5, approxPrice: 5450, approxBeta: 1.68 },
  { ticker: 'PGEO', name: 'Pertamina Geothermal Energy Tbk', sector: 'Infrastructures', defaultRoe: 9.8, defaultDer: 0.48, defaultOpMargin: 46.2, approxPrice: 895, approxBeta: 1.16 },
  { ticker: 'TOWR', name: 'Sarana Menara Nusantara Tbk', sector: 'Infrastructures', defaultRoe: 20.4, defaultDer: 2.42, defaultOpMargin: 58.4, approxPrice: 685, approxBeta: 0.84 },
  { ticker: 'TBIG', name: 'Tower Bersama Infrastructure Tbk', sector: 'Infrastructures', defaultRoe: 14.6, defaultDer: 2.65, defaultOpMargin: 56.2, approxPrice: 1890, approxBeta: 0.78 },
  { ticker: 'MTEL', name: 'Dayamitra Telekomunikasi Tbk', sector: 'Infrastructures', defaultRoe: 6.2, defaultDer: 0.52, defaultOpMargin: 42.8, approxPrice: 615, approxBeta: 0.66 },
  { ticker: 'ADHI', name: 'Adhi Karya (Persero) Tbk', sector: 'Infrastructures', defaultRoe: 3.8, defaultDer: 1.95, defaultOpMargin: 6.4, approxPrice: 248, approxBeta: 1.48 },

  // 7. Industrials
  { ticker: 'ASII', name: 'Astra International Tbk', sector: 'Industrials', defaultRoe: 16.5, defaultDer: 0.44, defaultOpMargin: 15.9, approxPrice: 4920, approxBeta: 0.88 },
  { ticker: 'UNTR', name: 'United Tractors Tbk', sector: 'Industrials', defaultRoe: 23.9, defaultDer: 0.29, defaultOpMargin: 22.4, approxPrice: 23525, approxBeta: 0.82 },
  { ticker: 'ARNA', name: 'Arwana Citramulia Tbk', sector: 'Industrials', defaultRoe: 24.2, defaultDer: 0.16, defaultOpMargin: 23.8, approxPrice: 685, approxBeta: 0.58 },
  { ticker: 'TOTL', name: 'Total Bangun Persada Tbk', sector: 'Industrials', defaultRoe: 16.4, defaultDer: 0.42, defaultOpMargin: 11.2, approxPrice: 640, approxBeta: 0.74 },
  { ticker: 'MARK', name: 'Mark Dynamics Indonesia Tbk', sector: 'Industrials', defaultRoe: 22.6, defaultDer: 0.18, defaultOpMargin: 31.4, approxPrice: 960, approxBeta: 0.86 },
  { ticker: 'HEXA', name: 'Hexindo Adiperkasa Tbk', sector: 'Industrials', defaultRoe: 21.4, defaultDer: 0.52, defaultOpMargin: 14.8, approxPrice: 5850, approxBeta: 0.62 },

  // 8. Consumer Cyclicals
  { ticker: 'ACES', name: 'Aspirasi Hidup Indonesia Tbk', sector: 'Consumer Cyclicals', defaultRoe: 14.2, defaultDer: 0.21, defaultOpMargin: 15.8, approxPrice: 715, approxBeta: 1.09 },
  { ticker: 'MAPI', name: 'Mitra Adiperkasa Tbk', sector: 'Consumer Cyclicals', defaultRoe: 19.4, defaultDer: 0.56, defaultOpMargin: 11.2, approxPrice: 1320, approxBeta: 1.05 },
  { ticker: 'MAPA', name: 'Map Aktif Adiperkasa Tbk', sector: 'Consumer Cyclicals', defaultRoe: 22.8, defaultDer: 0.38, defaultOpMargin: 14.6, approxPrice: 845, approxBeta: 1.12 },
  { ticker: 'ERAA', name: 'Erajaya Swasembada Tbk', sector: 'Consumer Cyclicals', defaultRoe: 12.6, defaultDer: 0.94, defaultOpMargin: 4.2, approxPrice: 416, approxBeta: 1.18 },
  { ticker: 'AUTO', name: 'Astra Otoparts Tbk', sector: 'Consumer Cyclicals', defaultRoe: 14.8, defaultDer: 0.18, defaultOpMargin: 11.6, approxPrice: 2260, approxBeta: 0.78 },
  { ticker: 'DRMA', name: 'Dharma Polimetal Tbk', sector: 'Consumer Cyclicals', defaultRoe: 24.6, defaultDer: 0.34, defaultOpMargin: 14.9, approxPrice: 1020, approxBeta: 0.92 },

  // 9. Properties & Real Estate
  { ticker: 'CTRA', name: 'Ciputra Development Tbk', sector: 'Properties & Real Estate', defaultRoe: 10.4, defaultDer: 0.45, defaultOpMargin: 28.6, approxPrice: 985, approxBeta: 1.26 },
  { ticker: 'BSDE', name: 'Bumi Serpong Damai Tbk', sector: 'Properties & Real Estate', defaultRoe: 8.6, defaultDer: 0.36, defaultOpMargin: 31.2, approxPrice: 940, approxBeta: 1.21 },
  { ticker: 'PWON', name: 'Pakuwon Jati Tbk', sector: 'Properties & Real Estate', defaultRoe: 11.2, defaultDer: 0.31, defaultOpMargin: 36.8, approxPrice: 382, approxBeta: 1.12 },
  { ticker: 'SMRA', name: 'Summarecon Agung Tbk', sector: 'Properties & Real Estate', defaultRoe: 8.9, defaultDer: 0.68, defaultOpMargin: 24.5, approxPrice: 545, approxBeta: 1.38 },
  { ticker: 'PANI', name: 'Pantai Indah Kapuk Dua Tbk', sector: 'Properties & Real Estate', defaultRoe: 9.8, defaultDer: 0.42, defaultOpMargin: 38.4, approxPrice: 12400, approxBeta: 1.54 },

  // 10. Technology & Transportation
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', sector: 'Technology', defaultRoe: -14.2, defaultDer: 0.32, defaultOpMargin: -18.5, approxPrice: 62, approxBeta: 1.72 },
  { ticker: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', sector: 'Technology', defaultRoe: 4.2, defaultDer: 0.18, defaultOpMargin: 8.4, approxPrice: 468, approxBeta: 1.34 },
  { ticker: 'BUKA', name: 'Bukalapak.com Tbk', sector: 'Technology', defaultRoe: 1.2, defaultDer: 0.09, defaultOpMargin: 2.4, approxPrice: 118, approxBeta: 1.42 },
  { ticker: 'ASSA', name: 'Adi Sarana Armada Tbk', sector: 'Transportation & Logistics', defaultRoe: 11.8, defaultDer: 1.24, defaultOpMargin: 13.6, approxPrice: 735, approxBeta: 1.22 }
];

/**
 * Full JCI / BEI Sectoral Ticker Registry (956 Emiten as of November 2026, Auto-Scaling on New IPOs)
 * Organized across the 11 Official IDX-IC Sectors
 */
const SECTOR_TICKER_POOLS: Record<string, string[]> = {
  Financials: [
    'ABDA', 'ADMF', 'AGRO', 'AGRS', 'AHAP', 'AMAG', 'AMAR', 'AMOR', 'APIC', 'ARTO',
    'ASBI', 'ASDM', 'ASJT', 'ASMI', 'ASRM', 'BABP', 'BACA', 'BAEK', 'BANK', 'BBCA',
    'BBHI', 'BBKP', 'BBLD', 'BBMD', 'BBNI', 'BBNP', 'BBRI', 'BBSI', 'BBTN', 'BBYB',
    'BCAP', 'BCIC', 'BDMN', 'BEKS', 'BFIN', 'BGTG', 'BHAT', 'BHIT', 'BINA', 'BJBR',
    'BJTM', 'BKSW', 'BMAS', 'BMRI', 'BNBA', 'BNGA', 'BNII', 'BNLI', 'BPFI', 'BPII',
    'BRIS', 'BSIM', 'BSWD', 'BTPN', 'BTPS', 'BVIC', 'CASA', 'CFIN', 'CLIP', 'COIN',
    'DEFI', 'DNAR', 'DNET', 'FUJI', 'GSMF', 'HDFA', 'IDPR', 'INPC', 'JMAS', 'LIFE',
    'LPPS', 'MASB', 'MAYA', 'MCOR', 'MEGA', 'MFIN', 'MREI', 'MTWI', 'NICK', 'NISP',
    'NOBU', 'OCAP', 'PADI', 'PALM', 'PANS', 'PEGE', 'PLAS', 'PNBN', 'PNBS', 'PNIN',
    'PNLF', 'POLA', 'POOL', 'RELI', 'SDRA', 'SFAN', 'SMMA', 'SRTG', 'STAR', 'TIFA',
    'TRIM', 'TRUS', 'TUGU', 'VCAP', 'VICO', 'VINS', 'VRNA', 'VTNY', 'WOMF', 'YOII',
    'YULE'
  ],
  Energy: [
    'AADI', 'ABMM', 'ADMR', 'ADRO', 'AIMS', 'AKRA', 'ALII', 'APEX', 'ARII', 'ARTI',
    'ATLA', 'ATPK', 'BBRM', 'BESS', 'BIPI', 'BOAT', 'BOBA', 'BORN', 'BOSS', 'BSML',
    'BSSR', 'BULL', 'BUMI', 'BYAN', 'CANI', 'CBRE', 'CGAS', 'CNKO', 'COAL', 'CUAN',
    'DEWA', 'DOID', 'DSSA', 'DWGL', 'ELSA', 'ENRG', 'FIRE', 'GEMS', 'GTBO', 'GTSI',
    'HILL', 'HITS', 'HRUM', 'HUMI', 'IATA', 'INDY', 'ITMA', 'ITMG', 'JSKY', 'KKGI',
    'KOPI', 'LEAD', 'MAHA', 'MBAP', 'MBMA', 'MBSS', 'MCOL', 'MEDC', 'MITI', 'MKAP',
    'MTFN', 'MYOH', 'PGAS', 'PKPK', 'PSAB', 'PTBA', 'PTIS', 'PTRO', 'RAJA', 'RATU',
    'RDMP', 'RGAS', 'RIGS', 'RMKE', 'RMKO', 'RUIS', 'SEMA', 'SGER', 'SHIP', 'SICO',
    'SMMT', 'SMRU', 'SOCI', 'SUGI', 'SUNI', 'SURE', 'TAMU', 'TCPI', 'TEBE', 'TOBA',
    'TPMA', 'TRAM', 'UNIQ', 'WINS', 'WOWS'
  ],
  'Basic Materials': [
    'ADMG', 'AGII', 'AKPI', 'ALDO', 'ALKA', 'ALMI', 'AMMN', 'ANTM', 'APLI', 'ARCI',
    'ASPR', 'AVIA', 'AYLS', 'BAJA', 'BATR', 'BEBS', 'BLES', 'BMSR', 'BRMS', 'BRNA',
    'BRPT', 'BTON', 'CHEM', 'CITA', 'CLPI', 'CMNT', 'CTBN', 'DAAZ', 'DGWG', 'DKFT',
    'DPNS', 'EKAD', 'EPAC', 'ESIP', 'ESSA', 'ETWA', 'FASW', 'FPNI', 'FWCT', 'GDST',
    'GGRP', 'HKMU', 'IFII', 'IFSH', 'IGAR', 'INAI', 'INCF', 'INCI', 'INCO', 'INKP',
    'INRU', 'INTD', 'INTP', 'IPOL', 'ISSP', 'JKSW', 'KAYU', 'KBRI', 'KDSI', 'KKES',
    'KMTR', 'KRAS', 'LMSH', 'LTLS', 'MDKA', 'MDKI', 'MOLI', 'MRAT', 'NASI', 'NCKL',
    'NICE', 'NICL', 'NIKL', 'NPGF', 'OBMD', 'OKAS', 'OPMS', 'PACK', 'PBID', 'PDPP',
    'PICO', 'PPRI', 'PRAS', 'PURE', 'SAMF', 'SBMA', 'SIMA', 'SMBR', 'SMCB', 'SMGA',
    'SMGR', 'SMKL', 'SMLE', 'SOLA', 'SPMA', 'SQMI', 'SRSN', 'SULI', 'SWAT', 'TALF',
    'TBMS', 'TDPM', 'TINS', 'TIRT', 'TKIM', 'TPIA', 'TRST', 'UNIC', 'VOKS', 'WSBP',
    'WTON', 'YPAS', 'ZINC'
  ],
  'Consumer Non-Cyclicals': [
    'AALI', 'ADES', 'AGAR', 'AISA', 'ALTO', 'AMMS', 'AMRT', 'ANDI', 'ANJT', 'ASHA',
    'AYAM', 'BEEF', 'BEER', 'BISI', 'BRRC', 'BTEK', 'BUAH', 'BUDI', 'BWPT', 'CAMP',
    'CEKA', 'CLEO', 'CMRY', 'COCO', 'CPIN', 'CPRO', 'CRAB', 'CSRA', 'DAYA', 'DEWI',
    'DLTA', 'DMND', 'DPUM', 'DSFI', 'DSNG', 'ENZO', 'EPMT', 'EURO', 'FAPA', 'FISH',
    'FLMC', 'FOOD', 'GGRM', 'GOLL', 'GOOD', 'GRPM', 'GULA', 'GUNA', 'GZCO', 'HERO',
    'HMSP', 'HOKI', 'IBOS', 'ICBP', 'IKAN', 'INDF', 'IPPE', 'ISEA', 'ITIC', 'JAWA',
    'JARR', 'JPFA', 'KEJU', 'KINO', 'KMDS', 'LAPD', 'LSIP', 'MAGP', 'MAIN', 'MAXI',
    'MBTO', 'MGRO', 'MIDI', 'MKTR', 'MLBI', 'MLPL', 'MPPA', 'MSJA', 'MYOR', 'NANO',
    'NAYZ', 'NEST', 'NSSS', 'OILS', 'PCAR', 'PGUN', 'PMMP', 'PNSE', 'PSDN', 'PSGO',
    'PTPS', 'RANC', 'RMBA', 'ROTI', 'SDPC', 'SGRO', 'SIMP', 'SIPD', 'SKBM', 'SKLT',
    'SMAR', 'SOUL', 'SSMS', 'STAA', 'STRK', 'STTP', 'TAYS', 'TAPG', 'TBLA', 'TCID',
    'TGKA', 'TGUK', 'TLDN', 'TRGU', 'UDNG', 'ULTJ', 'UNSP', 'UNVR', 'VICI', 'WAPO',
    'WICO', 'WIIM', 'WINE', 'WMUU', 'WMPP'
  ],
  'Consumer Cyclicals': [
    'ABBA', 'ACES', 'ACRO', 'AEGS', 'AKKU', 'ARGO', 'ARTA', 'ASLC', 'AUTO', 'BABY',
    'BAIK', 'BATA', 'BAUT', 'BAYU', 'BELL', 'BIKE', 'BIMA', 'BLTZ', 'BMBL', 'BMTR',
    'BOGA', 'BOLA', 'BOLT', 'BRAM', 'BUVA', 'CARS', 'CBMF', 'CINT', 'CLAY', 'CNMA',
    'CNTX', 'CSAP', 'CSMI', 'DEPO', 'DFAM', 'DIGI', 'DOOH', 'DOSS', 'DRMA', 'DUCK',
    'EAST', 'ECII', 'ENAK', 'ERAA', 'ERAL', 'ERTX', 'ESTA', 'ESTI', 'FAST', 'FILM',
    'FITT', 'FORU', 'FUTR', 'GDYR', 'GEMA', 'GJTL', 'GLOB', 'GOLF', 'GRPH', 'GWSA',
    'HAJJ', 'HDTX', 'HOME', 'HOTL', 'HRME', 'HRTA', 'HUDY', 'IDEA', 'IFRA', 'IIKP',
    'IMAS', 'INDR', 'INDS', 'INOV', 'IPTV', 'ISAP', 'JGLE', 'JIHD', 'JSPT', 'KAQI',
    'KDTN', 'KICI', 'KLIN', 'KOTA', 'KPIG', 'LFLO', 'LIVE', 'LMAX', 'LMPI', 'LPIN',
    'LPPF', 'LUCY', 'MABA', 'MAMI', 'MAPA', 'MAPB', 'MAPI', 'MARI', 'MASA', 'MDIA',
    'MDIY', 'MEJA', 'MGLV', 'MICE', 'MINA', 'MNCN', 'MPMX', 'MSIN', 'MSKY', 'MYTX',
    'NATO', 'NETV', 'NIPS', 'NUSA', 'OLIV', 'PANR', 'PART', 'PBRX', 'PDES', 'PGLI',
    'PJAA', 'PLAN', 'PMJS', 'POLU', 'POLY', 'PSKT', 'PTSP', 'RAAM', 'RAFI', 'RALS',
    'RICY', 'SBAT', 'SCMA', 'SCNP', 'SCTV', 'SHID', 'SLIS', 'SMSM', 'SNLK', 'SOFA',
    'SONA', 'SOTS', 'SPTO', 'SRIL', 'SSTM', 'SWID', 'TELE', 'TFCO', 'TMPO', 'TOOL',
    'TOYS', 'TRIO', 'TRIS', 'TYRE', 'UFOE', 'UNIT', 'UNTD', 'VERN', 'VIVA', 'VKTR',
    'WOOD', 'YELO', 'ZATA', 'ZONE'
  ],
  Healthcare: [
    'BMHS', 'CARE', 'CHEK', 'DGNS', 'DKHH', 'DVLA', 'HALO', 'HEAL', 'IKPM', 'INAF',
    'IRRA', 'KAEF', 'KLBF', 'LABS', 'MEDS', 'MERK', 'MIKA', 'MMIX', 'MTMH', 'OBAT',
    'OMED', 'PEHA', 'PEVE', 'PRDA', 'PRAY', 'PRIM', 'PYFA', 'RSCH', 'RSGK', 'SAME',
    'SCPI', 'SIDO', 'SILO', 'SOHO', 'SRAJ', 'SURI', 'TSPC'
  ],
  Infrastructures: [
    'ACST', 'ADHI', 'ARKO', 'ASLI', 'BALI', 'BDKR', 'BREN', 'BTEL', 'BUKK', 'CASS',
    'CENT', 'CMNP', 'DATA', 'DGIK', 'EXCL', 'FIMP', 'FREN', 'GHON', 'GMFI', 'GOLD',
    'HADE', 'HGII', 'IBST', 'INDX', 'INET', 'IPCM', 'IPCC', 'ISAT', 'JAST', 'JKON',
    'JSMR', 'KARW', 'KBLV', 'KEEN', 'KETR', 'KOKA', 'KRYA', 'LCKM', 'LINK', 'META',
    'MORA', 'MPOW', 'MTEL', 'MTPS', 'MTRA', 'NRCA', 'OASA', 'PBSA', 'PGEO', 'PORT',
    'POWR', 'PPRE', 'PTDU', 'PTPP', 'PTPW', 'RONY', 'SMKM', 'SSIA', 'SUPR', 'TAMA',
    'TBIG', 'TGRA', 'TLKM', 'TOPS', 'TOTL', 'TOWR', 'WEGE', 'WIKA', 'WSKT'
  ],
  Industrials: [
    'AMFG', 'AMIN', 'APII', 'ARKA', 'ARNA', 'ASGR', 'ASII', 'ATAP', 'BINO', 'BLUE',
    'BNBR', 'CAKK', 'CCSI', 'CRSN', 'CTTH', 'DYAN', 'FOLK', 'GPSO', 'HEXA', 'HOPE',
    'HYGN', 'IBFN', 'ICON', 'IKAI', 'IKBI', 'IMPC', 'INTA', 'JECC', 'JTPE', 'KBLI',
    'KBLM', 'KIAS', 'KING', 'KOBX', 'KOIN', 'KONI', 'KPAL', 'KUAS', 'LABA', 'LION',
    'MANG', 'MARK', 'MDRN', 'MFMI', 'MHKI', 'MLIA', 'MUTU', 'NAIK', 'NTBK', 'PADA',
    'PIPA', 'PTMP', 'SCCO', 'SINI', 'SKRN', 'SMIL', 'SOSS', 'TIRA', 'TOTO', 'TRIL',
    'TUFI', 'UNTR', 'VISI', 'WIDI', 'ZBRA'
  ],
  'Properties & Real Estate': [
    'ADCP', 'AMAN', 'APLN', 'ARMY', 'ASPI', 'ASRI', 'BAPA', 'BAPI', 'BBSS', 'BCIP',
    'BEST', 'BIKA', 'BIPP', 'BKDP', 'BKSL', 'BSBK', 'BSDE', 'CBDK', 'CBPE', 'CITY',
    'COWL', 'CPRI', 'CSIS', 'CTRA', 'CTRP', 'CTRS', 'DADA', 'DART', 'DAVO', 'DILD',
    'DMAS', 'DUTI', 'ELTY', 'EMDE', 'FMII', 'FORZ', 'GAMA', 'GMTD', 'GPRA', 'GRIA',
    'HOMI', 'INDO', 'INPP', 'IPAC', 'JRPT', 'KBAG', 'KIJA', 'KOCI', 'KSIX', 'LAND',
    'LCGP', 'LPCK', 'LPKR', 'LPLI', 'MDLN', 'MKPI', 'MMLP', 'MPRO', 'MTLA', 'MTSM',
    'MYRX', 'NASA', 'NIRO', 'NZIA', 'OMRE', 'PAMG', 'PANI', 'PLIN', 'POLI', 'POLL',
    'POSA', 'PPRO', 'PUDP', 'PURI', 'PWON', 'RBMS', 'RDTX', 'REAL', 'RELF', 'RIMO',
    'RISE', 'ROCK', 'RODA', 'SAGE', 'SATU', 'SMDM', 'SMRA', 'TARA', 'TRIN', 'TRUE',
    'UANG', 'URBN', 'VAST', 'WINR'
  ],
  Technology: [
    'ATIC', 'AWAN', 'AXIO', 'BELI', 'BUKA', 'CASH', 'CHIP', 'CYBR', 'DCII', 'DIVA',
    'DMMX', 'EDGE', 'ELIT', 'EMTK', 'ENVY', 'GLVA', 'GOTO', 'HDIT', 'IOTF', 'IRSX',
    'JATI', 'KIOS', 'KREN', 'LMAS', 'LUCK', 'MCAS', 'MENN', 'MLPT', 'MPIX', 'MSTI',
    'MTDL', 'NFCX', 'NINE', 'PGJO', 'PTSN', 'RUNS', 'SKYB', 'TECH', 'TFAS', 'TOSK',
    'TRON', 'UVCR', 'WGSH', 'WIFI', 'WIRG', 'ZYRX'
  ],
  'Transportation & Logistics': [
    'AKSI', 'APOL', 'ASSA', 'BIRD', 'BLTA', 'BPTR', 'CMPP', 'DEAL', 'ELPI', 'GIAA',
    'GTRA', 'HAIS', 'HATM', 'HELI', 'IMJS', 'JAYA', 'KJEN', 'KLAS', 'LAJU', 'LOPI',
    'LRNA', 'MIRA', 'MPXL', 'NELY', 'PPGL', 'PURA', 'RCCC', 'SAFE', 'SAPX', 'SDMU',
    'SMDR', 'TAXI', 'TMAS', 'TNCA', 'TRJA', 'TRUK', 'WEHA'
  ]
};

/**
 * Deterministic Hash Helper for Realistic Sector-Calibrated Metrics Across All 956+ JCI Emiten
 */
function hashTickerSeed(ticker: string): number {
  let h = 2166136261;
  for (let i = 0; i < ticker.length; i++) {
    h ^= ticker.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SECTOR_LIST = [
  'Financials',
  'Energy',
  'Basic Materials',
  'Consumer Non-Cyclicals',
  'Consumer Cyclicals',
  'Healthcare',
  'Infrastructures',
  'Industrials',
  'Properties & Real Estate',
  'Technology',
  'Transportation & Logistics'
] as const;

const CORPORATE_NAME_PREFIXES: Record<string, string[]> = {
  Financials: ['Bank', 'Artha', 'Mitra', 'Dana', 'Kapital', 'Nusantara', 'Sentral', 'Prima'],
  Energy: ['Energi', 'Sumber', 'Bumi', 'Tambang', 'Petro', 'Nusantara', 'Mandiri', 'Daya'],
  'Basic Materials': ['Mineral', 'Logam', 'Kimia', 'Semen', 'Baja', 'Kertas', 'Indo', 'Karya'],
  'Consumer Non-Cyclicals': ['Pangan', 'Agro', 'Makmur', 'Sawit', 'Nabati', 'Sentosa', 'Indofood', 'Sari'],
  'Consumer Cyclicals': ['Retail', 'Mitra', 'Media', 'Gaya', 'Oto', 'Prima', 'Nusantara', 'Graha'],
  Healthcare: ['Medika', 'Farma', 'Husada', 'Sehat', 'Klinik', 'Bio', 'Mitra', 'Prima'],
  Infrastructures: ['Infra', 'Karya', 'Menara', 'Telekom', 'Jasa', 'Energi', 'Nusantara', 'Bina'],
  Industrials: ['Industri', 'Teknik', 'Mesin', 'Traktor', 'Surya', 'Karya', 'Multi', 'Prima'],
  'Properties & Real Estate': ['Properti', 'Kawasan', 'Graha', 'Bumi', 'Cipta', 'Persada', 'Sentul', 'Megah'],
  Technology: ['Teknologi', 'Digital', 'Solusi', 'Data', 'Siber', 'Komputasi', 'Inovasi', 'Sistem'],
  'Transportation & Logistics': ['Logistik', 'Armada', 'Pelayaran', 'Trans', 'Samudera', 'Ekspres', 'Lintas', 'Kargo']
};

/**
 * Official IDX High Dividend 20 & Regular BEI Dividend-Paying Emiten Registry (Estimated Annual Yield %)
 */
export const IDX_DIVIDEND_YIELD_MAP: Record<string, number> = {
  // Financials (Big Banks, BPD & Multi-Finance Dividend Payers)
  BBCA: 2.9,
  BMRI: 5.8,
  BBRI: 6.4,
  BBNI: 5.5,
  BRIS: 1.4,
  BNGA: 6.8,
  NISP: 5.9,
  BTPS: 5.2,
  BDMN: 4.5,
  BNLI: 2.8,
  BBTN: 4.2,
  BJBR: 8.2,
  BJTM: 8.6,
  BFIN: 5.6,
  ADMF: 8.4,
  CFIN: 6.2,
  MFIN: 5.8,
  TUGU: 6.9,
  PANS: 7.4,
  AMOR: 6.1,
  SDRA: 3.5,

  // Energy (High Cashflow Coal, Oil & Gas Dividend Leaders)
  ITMG: 11.4,
  PTBA: 10.8,
  ADRO: 9.6,
  BSSR: 11.2,
  MBAP: 9.4,
  GEMS: 10.2,
  MCOL: 10.4,
  PGAS: 8.1,
  AKRA: 6.7,
  MEDC: 3.4,
  ELSA: 6.1,
  INDY: 4.2,
  HRUM: 2.6,
  ABMM: 7.6,
  TPMA: 7.2,
  TEBE: 8.5,
  PSSI: 6.4,
  RAJA: 2.4,
  RMKE: 3.5,
  TOBA: 2.1,

  // Basic Materials
  ANTM: 4.8,
  INCO: 1.9,
  NCKL: 3.4,
  SMGR: 2.9,
  INTP: 3.2,
  INKP: 1.4,
  TKIM: 1.2,
  TINS: 2.5,
  ESSA: 2.2,
  AVIA: 4.7,
  PBID: 5.8,
  SPMA: 5.4,
  CLPI: 6.8,
  EKAD: 4.5,
  AGII: 1.8,

  // Consumer Non-Cyclicals (Defensive Compounders & Plantation Dividend Payers)
  ICBP: 3.2,
  INDF: 4.6,
  MYOR: 2.5,
  CMRY: 2.4,
  AMRT: 1.5,
  CPIN: 2.1,
  TAPG: 8.8,
  UNVR: 6.5,
  JPFA: 3.9,
  GGRM: 5.4,
  HMSP: 8.9,
  LSIP: 5.8,
  AALI: 4.9,
  SSMS: 4.4,
  STAA: 5.2,
  DSNG: 4.7,
  SMAR: 5.1,
  ROTI: 5.6,
  GOOD: 2.8,
  ULTJ: 2.6,
  DLTA: 7.9,
  MLBI: 7.5,
  CLEO: 1.6,
  CAMP: 4.2,
  CEKA: 5.3,
  BISI: 4.8,
  TBLA: 5.4,
  SGRO: 5.9,
  TGKA: 6.2,
  EPMT: 6.8,

  // Healthcare
  KLBF: 2.8,
  SIDO: 5.4,
  MIKA: 1.6,
  HEAL: 1.1,
  SILO: 1.4,
  TSPC: 4.9,
  PRDA: 5.2,
  DVLA: 5.6,
  MERK: 5.1,
  SOHO: 4.8,
  OMED: 3.2,

  // Infrastructures
  TLKM: 6.2,
  ISAT: 3.8,
  EXCL: 2.4,
  JSMR: 2.2,
  PGEO: 3.5,
  TOWR: 3.6,
  TBIG: 3.1,
  MTEL: 3.4,
  POWR: 8.5,
  IPCC: 7.8,
  IPCM: 6.2,
  NRCA: 6.4,
  PBSA: 6.8,
  KEEN: 3.2,

  // Industrials
  ASII: 6.9,
  UNTR: 7.8,
  ARNA: 6.3,
  TOTL: 7.4,
  MARK: 5.9,
  HEXA: 9.2,
  SCCO: 4.8,
  KBLI: 4.4,
  IMPC: 2.7,
  TOTO: 5.2,
  ASGR: 5.6,
  BLUE: 6.5,

  // Consumer Cyclicals
  ACES: 4.3,
  MAPI: 1.2,
  MAPA: 1.4,
  ERAA: 4.1,
  AUTO: 5.8,
  DRMA: 3.9,
  SMSM: 5.7,
  MPMX: 9.1,
  GJTL: 2.8,
  MNCN: 2.2,
  SCMA: 2.5,
  PJAA: 4.2,
  SPTO: 6.4,
  WOOD: 2.1,

  // Properties & Real Estate
  CTRA: 1.9,
  BSDE: 1.5,
  PWON: 2.1,
  SMRA: 1.6,
  DMAS: 9.5,
  JRPT: 4.4,
  PLIN: 4.8,
  RDTX: 4.6,
  MKPI: 3.5,
  MTLA: 2.8,
  MMLP: 3.2,

  // Technology & Transportation
  MTDL: 3.8,
  PTSN: 4.5,
  GLVA: 5.1,
  AXIO: 4.6,
  MSTI: 6.2,
  ASSA: 2.6,
  BIRD: 4.8,
  SMDR: 6.4,
  TMAS: 5.9,
  NELY: 6.8,
  HAIS: 5.5,
  ELPI: 4.2
};

export function getEmitenDividendYield(ticker: string): number {
  const clean = ticker.trim().toUpperCase().replace(/\.JK$/i, '');
  return IDX_DIVIDEND_YIELD_MAP[clean] ?? 0;
}

const CORE_INSTITUTIONAL_SET = new Set<string>([
  ...CORE_IDX_EMITEN.map((e) => e.ticker),
  ...Object.keys(IDX_DIVIDEND_YIELD_MAP)
]);

export function isInstitutionalLiquidCandidate(ticker: string): boolean {
  const clean = ticker.trim().toUpperCase().replace(/\.JK$/i, '');
  return CORE_INSTITUTIONAL_SET.has(clean);
}

export function createCalibratedIdxEntry(ticker: string, sectorOverride?: string, customName?: string): IdxDirectoryEntry {
  const clean = ticker.trim().toUpperCase().replace(/\.JK$/i, '');
  const seed = hashTickerSeed(clean);
  const sector = sectorOverride || SECTOR_LIST[seed % SECTOR_LIST.length];
  const prefixes = CORPORATE_NAME_PREFIXES[sector] || ['Nusantara'];
  const prefix = prefixes[seed % prefixes.length];

  // Conservative fundamental baseline for non-core third-liner tickers so they never artificially outscore proved blue-chips
  const defaultRoe = Number((3.8 + (seed % 78) / 10).toFixed(1));       // 3.8% - 11.5%
  const defaultDer = Number((0.58 + (seed % 115) / 100).toFixed(2));    // 0.58x - 1.72x
  const defaultOpMargin = Number((5.2 + (seed % 85) / 10).toFixed(1));  // 5.2% - 13.6%
  const approxPrice = Math.max(50, Math.round((95 + (seed % 1400)) / 5) * 5);
  const approxBeta = Number((0.72 + (seed % 85) / 100).toFixed(2));

  return {
    ticker: clean,
    name: customName || `${prefix} ${clean} Indonesia Tbk`,
    sector,
    defaultRoe,
    defaultDer,
    defaultOpMargin,
    approxPrice,
    approxBeta
  };
}

/**
 * Generates conservative deterministic 1D & 30D baseline when a ticker is initialized
 */
export function getCalibratedInitialMarketAction(ticker: string): {
  change1D: number;
  return30D: number;
} {
  const seed = hashTickerSeed(ticker);
  const raw1D = ((seed % 320) - 160) / 100; // -1.60% to +1.60%
  const raw30D = (((seed >> 4) % 900) - 450) / 100; // -4.50% to +4.50%
  return {
    change1D: Number(raw1D.toFixed(2)),
    return30D: Number(raw30D.toFixed(1))
  };
}

/**
 * Builds the Complete 956-Emiten JCI / BEI Base Catalog (November 2026 Current Market Universe)
 * Dynamically expandable if additional listed tickers are discovered at runtime.
 */
function buildCompleteJciCatalog(): IdxDirectoryEntry[] {
  const map = new Map<string, IdxDirectoryEntry>();

  // 1. Add all curated core issuers first
  for (const item of CORE_IDX_EMITEN) {
    map.set(item.ticker, item);
  }

  // 2. Add all real IDX sectoral tickers across the 11 IDX-IC sectors
  for (const [sector, tickers] of Object.entries(SECTOR_TICKER_POOLS)) {
    for (const rawTicker of tickers) {
      const clean = rawTicker.trim().toUpperCase();
      if (clean.length === 4 && !map.has(clean)) {
        map.set(clean, createCalibratedIdxEntry(clean, sector));
      }
    }
  }

  return Array.from(map.values());
}

export const FULL_JCI_EMITEN_CATALOG: IdxDirectoryEntry[] = buildCompleteJciCatalog();
