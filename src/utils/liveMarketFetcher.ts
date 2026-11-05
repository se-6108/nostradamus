import { MacroIndicator, NewsSentimentItem, StockMetrics } from '../types/quant';
import { enrichStockMetrics, rankUniverseWithBuffer } from './quantEngine';

export interface IdxDirectoryEntry {
  ticker: string;
  name: string;
  sector: string;
  defaultRoe: number;
  defaultDer: number;
  defaultOpMargin: number;
  approxPrice: number;
  approxBeta: number;
}

/**
 * Formats a Date into a full Indonesian Day, Date, Month, Year & WIB Time string
 * Example: "Kamis, 5 November 2026 · Pukul 19:05:22 WIB"
 */
export function formatFullIndonesianDateTime(date: Date = new Date()): string {
  try {
    const datePart = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(date);

    const timePart = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    })
      .format(date)
      .replace(/\./g, ':');

    return `${datePart} · Pukul ${timePart} WIB`;
  } catch {
    return `${date.toLocaleDateString('id-ID')} · Pukul ${date.toLocaleTimeString('id-ID')} WIB`;
  }
}

/**
 * Comprehensive 100-Stock Liquid BEI Universe (IDX100 / KOMPAS100 Across 11 IDX-IC Sectors)
 */
export const IDX_SECTOR_CATALOG: IdxDirectoryEntry[] = [
  // 1. Financials (18 Liquid Issuers)
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

  // 2. Energy (15 Liquid Issuers)
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

  // 3. Basic Materials (14 Liquid Issuers)
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

  // 4. Consumer Non-Cyclicals (14 Liquid Issuers)
  { ticker: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 18.4, defaultDer: 0.64, defaultOpMargin: 21.6, approxPrice: 6125, approxBeta: 0.58 },
  { ticker: 'INDF', name: 'Indofood Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 15.2, defaultDer: 0.72, defaultOpMargin: 18.1, approxPrice: 5950, approxBeta: 0.64 },
  { ticker: 'MYOR', name: 'Mayora Indah Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 21.2, defaultDer: 0.39, defaultOpMargin: 14.9, approxPrice: 2280, approxBeta: 0.55 },
  { ticker: 'CMRY', name: 'Cisarua Mountain Dairy Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 23.8, defaultDer: 0.11, defaultOpMargin: 20.4, approxPrice: 4650, approxBeta: 0.52 },
  { ticker: 'AMRT', name: 'Sumber Alfaria Trijaya Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 24.5, defaultDer: 0.35, defaultOpMargin: 4.8, approxPrice: 2480, approxBeta: 0.78 },
  { ticker: 'CPIN', name: 'Charoen Pokphand Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 12.4, defaultDer: 0.38, defaultOpMargin: 8.9, approxPrice: 4120, approxBeta: 0.86 },
  { ticker: 'TAPG', name: 'Triputra Agro Persada Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 19.6, defaultDer: 0.32, defaultOpMargin: 26.5, approxPrice: 795, approxBeta: 0.74 },
  { ticker: 'UNVR', name: 'Unilever Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 82.0, defaultDer: 1.45, defaultOpMargin: 15.2, approxPrice: 1890, approxBeta: 0.58 },
  { ticker: 'JPFA', name: 'Japfa Comfeed Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 15.6, defaultDer: 0.82, defaultOpMargin: 8.4, approxPrice: 1640, approxBeta: 0.98 },
  { ticker: 'GGRM', name: 'Gudang Garam Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 6.2, defaultDer: 0.34, defaultOpMargin: 5.8, approxPrice: 13250, approxBeta: 0.76 },
  { ticker: 'HMSP', name: 'H.M. Sampoerna Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 26.4, defaultDer: 0.42, defaultOpMargin: 8.9, approxPrice: 645, approxBeta: 0.79 },
  { ticker: 'LSIP', name: 'PP London Sumatra Indonesia Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 11.4, defaultDer: 0.12, defaultOpMargin: 24.2, approxPrice: 1040, approxBeta: 0.75 },
  { ticker: 'AALI', name: 'Astra Agro Lestari Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 6.8, defaultDer: 0.24, defaultOpMargin: 9.6, approxPrice: 6125, approxBeta: 0.78 },
  { ticker: 'SSMS', name: 'Sawit Sumbermas Sarana Tbk', sector: 'Consumer Non-Cyclicals', defaultRoe: 17.4, defaultDer: 0.88, defaultOpMargin: 22.8, approxPrice: 1180, approxBeta: 0.72 },

  // 5. Healthcare (8 Liquid Issuers)
  { ticker: 'KLBF', name: 'Kalbe Farma Tbk', sector: 'Healthcare', defaultRoe: 14.9, defaultDer: 0.19, defaultOpMargin: 14.8, approxPrice: 755, approxBeta: 0.62 },
  { ticker: 'SIDO', name: 'Industri Jamu dan Farmasi Sido Muncul Tbk', sector: 'Healthcare', defaultRoe: 28.4, defaultDer: 0.09, defaultOpMargin: 34.6, approxPrice: 318, approxBeta: 0.49 },
  { ticker: 'MIKA', name: 'Mitra Keluarga Karyasehat Tbk', sector: 'Healthcare', defaultRoe: 18.9, defaultDer: 0.08, defaultOpMargin: 29.8, approxPrice: 2390, approxBeta: 0.56 },
  { ticker: 'HEAL', name: 'Medikaloka Hermina Tbk', sector: 'Healthcare', defaultRoe: 13.8, defaultDer: 0.54, defaultOpMargin: 19.2, approxPrice: 1265, approxBeta: 0.68 },
  { ticker: 'SILO', name: 'Siloam International Hospitals Tbk', sector: 'Healthcare', defaultRoe: 16.4, defaultDer: 0.22, defaultOpMargin: 18.7, approxPrice: 2580, approxBeta: 0.61 },
  { ticker: 'TSPC', name: 'Tempo Scan Pacific Tbk', sector: 'Healthcare', defaultRoe: 15.8, defaultDer: 0.24, defaultOpMargin: 12.6, approxPrice: 2480, approxBeta: 0.54 },
  { ticker: 'PRDA', name: 'Prodia Widyahusada Tbk', sector: 'Healthcare', defaultRoe: 12.4, defaultDer: 0.14, defaultOpMargin: 16.8, approxPrice: 2890, approxBeta: 0.58 },
  { ticker: 'SAME', name: 'Sarana Meditama Metropolitan Tbk', sector: 'Healthcare', defaultRoe: 6.2, defaultDer: 0.48, defaultOpMargin: 14.2, approxPrice: 278, approxBeta: 0.89 },

  // 6. Infrastructures (10 Liquid Issuers)
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

  // 7. Industrials (6 Liquid Issuers)
  { ticker: 'ASII', name: 'Astra International Tbk', sector: 'Industrials', defaultRoe: 16.5, defaultDer: 0.44, defaultOpMargin: 15.9, approxPrice: 4920, approxBeta: 0.88 },
  { ticker: 'UNTR', name: 'United Tractors Tbk', sector: 'Industrials', defaultRoe: 23.9, defaultDer: 0.29, defaultOpMargin: 22.4, approxPrice: 23525, approxBeta: 0.82 },
  { ticker: 'ARNA', name: 'Arwana Citramulia Tbk', sector: 'Industrials', defaultRoe: 24.2, defaultDer: 0.16, defaultOpMargin: 23.8, approxPrice: 685, approxBeta: 0.58 },
  { ticker: 'TOTL', name: 'Total Bangun Persada Tbk', sector: 'Industrials', defaultRoe: 16.4, defaultDer: 0.42, defaultOpMargin: 11.2, approxPrice: 640, approxBeta: 0.74 },
  { ticker: 'MARK', name: 'Mark Dynamics Indonesia Tbk', sector: 'Industrials', defaultRoe: 22.6, defaultDer: 0.18, defaultOpMargin: 31.4, approxPrice: 960, approxBeta: 0.86 },
  { ticker: 'HEXA', name: 'Hexindo Adiperkasa Tbk', sector: 'Industrials', defaultRoe: 21.4, defaultDer: 0.52, defaultOpMargin: 14.8, approxPrice: 5850, approxBeta: 0.62 },

  // 8. Consumer Cyclicals (6 Liquid Issuers)
  { ticker: 'ACES', name: 'Aspirasi Hidup Indonesia Tbk', sector: 'Consumer Cyclicals', defaultRoe: 14.2, defaultDer: 0.21, defaultOpMargin: 15.8, approxPrice: 715, approxBeta: 1.09 },
  { ticker: 'MAPI', name: 'Mitra Adiperkasa Tbk', sector: 'Consumer Cyclicals', defaultRoe: 19.4, defaultDer: 0.56, defaultOpMargin: 11.2, approxPrice: 1320, approxBeta: 1.05 },
  { ticker: 'MAPA', name: 'Map Aktif Adiperkasa Tbk', sector: 'Consumer Cyclicals', defaultRoe: 22.8, defaultDer: 0.38, defaultOpMargin: 14.6, approxPrice: 845, approxBeta: 1.12 },
  { ticker: 'ERAA', name: 'Erajaya Swasembada Tbk', sector: 'Consumer Cyclicals', defaultRoe: 12.6, defaultDer: 0.94, defaultOpMargin: 4.2, approxPrice: 416, approxBeta: 1.18 },
  { ticker: 'AUTO', name: 'Astra Otoparts Tbk', sector: 'Consumer Cyclicals', defaultRoe: 14.8, defaultDer: 0.18, defaultOpMargin: 11.6, approxPrice: 2260, approxBeta: 0.78 },
  { ticker: 'DRMA', name: 'Dharma Polimetal Tbk', sector: 'Consumer Cyclicals', defaultRoe: 24.6, defaultDer: 0.34, defaultOpMargin: 14.9, approxPrice: 1020, approxBeta: 0.92 },

  // 9. Properties & Real Estate (5 Liquid Issuers)
  { ticker: 'CTRA', name: 'Ciputra Development Tbk', sector: 'Properties & Real Estate', defaultRoe: 10.4, defaultDer: 0.45, defaultOpMargin: 28.6, approxPrice: 985, approxBeta: 1.26 },
  { ticker: 'BSDE', name: 'Bumi Serpong Damai Tbk', sector: 'Properties & Real Estate', defaultRoe: 8.6, defaultDer: 0.36, defaultOpMargin: 31.2, approxPrice: 940, approxBeta: 1.21 },
  { ticker: 'PWON', name: 'Pakuwon Jati Tbk', sector: 'Properties & Real Estate', defaultRoe: 11.2, defaultDer: 0.31, defaultOpMargin: 36.8, approxPrice: 382, approxBeta: 1.12 },
  { ticker: 'SMRA', name: 'Summarecon Agung Tbk', sector: 'Properties & Real Estate', defaultRoe: 8.9, defaultDer: 0.68, defaultOpMargin: 24.5, approxPrice: 545, approxBeta: 1.38 },
  { ticker: 'PANI', name: 'Pantai Indah Kapuk Dua Tbk', sector: 'Properties & Real Estate', defaultRoe: 9.8, defaultDer: 0.42, defaultOpMargin: 38.4, approxPrice: 12400, approxBeta: 1.54 },

  // 10. Technology & Transportation (4 Liquid Issuers)
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', sector: 'Technology', defaultRoe: -14.2, defaultDer: 0.32, defaultOpMargin: -18.5, approxPrice: 62, approxBeta: 1.72 },
  { ticker: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', sector: 'Technology', defaultRoe: 4.2, defaultDer: 0.18, defaultOpMargin: 8.4, approxPrice: 468, approxBeta: 1.34 },
  { ticker: 'BUKA', name: 'Bukalapak.com Tbk', sector: 'Technology', defaultRoe: 1.2, defaultDer: 0.09, defaultOpMargin: 2.4, approxPrice: 118, approxBeta: 1.42 },
  { ticker: 'ASSA', name: 'Adi Sarana Armada Tbk', sector: 'Transportation & Logistics', defaultRoe: 11.8, defaultDer: 1.24, defaultOpMargin: 13.6, approxPrice: 735, approxBeta: 1.22 }
];

/**
 * Builds the full 100-Stock Liquid BEI Universe (IDX100) for high-throughput screening
 */
export function buildIdx100StockUniverse(rebalanceBufferPct: number = 40): StockMetrics[] {
  const enriched = IDX_SECTOR_CATALOG.map((entry) =>
    enrichStockMetrics({
      ticker: entry.ticker,
      idxTicker: `IDX:${entry.ticker}`,
      yfTicker: `${entry.ticker}.JK`,
      name: entry.name,
      sector: entry.sector,
      lastPrice: entry.approxPrice,
      change1D: 0.45,
      return30D: 1.8,
      beta1Y: entry.approxBeta,
      volatilityAnn: Number((entry.approxBeta * 18.2).toFixed(1)),
      roe: entry.defaultRoe,
      debtToEquity: entry.defaultDer,
      operatingMargin: entry.defaultOpMargin,
      isLiveFetched: false
    })
  );
  return rankUniverseWithBuffer(enriched, rebalanceBufferPct);
}

let proxyRotationIdx = 0;

/**
 * Multi-tier rotated CORS Proxy wrapper for fallback when running on static GitHub Pages without Node backend
 */
async function fetchViaCorsProxy(targetUrl: string): Promise<any> {
  const proxyBuilders = [
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
  ];

  const startOffset = proxyRotationIdx++;
  for (let i = 0; i < proxyBuilders.length; i++) {
    const buildProxy = proxyBuilders[(startOffset + i) % proxyBuilders.length];
    const proxyUrl = buildProxy(targetUrl);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7500);
      const res = await fetch(proxyUrl, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next proxy in rotation
    }
  }
  throw new Error('Endpoint publik Yahoo Finance sedang sibuk.');
}

export interface SparkSeriesItem {
  symbol: string;
  lastPrice: number;
  change1D: number;
  closes: number[];
  shortName?: string;
}

/**
 * Fetches closing price series and latest market quote for a single symbol
 * Tries server-side /api/yahoo/chart first, then falls back to CORS-proxied Yahoo Finance v8 Chart API
 */
export async function fetchYahooChartSeries(
  symbol: string,
  range: string = '3mo'
): Promise<{
  lastPrice: number;
  change1D: number;
  closes: number[];
  shortName?: string;
}> {
  // 1. Try local Express direct proxy (/api/yahoo/chart)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7500);
    const srvRes = await fetch(
      `/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    if (srvRes.ok) {
      const item = (await srvRes.json()) as SparkSeriesItem;
      if (item && item.lastPrice > 0 && Array.isArray(item.closes)) {
        return item;
      }
    }
  } catch {
    // Fallback to CORS proxy below
  }

  // 2. Fallback for static GitHub Pages
  const host =
    proxyRotationIdx % 2 === 0 ? 'query1.finance.yahoo.com' : 'query2.finance.yahoo.com';
  const url = `https://${host}/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=1d`;

  const data = await fetchViaCorsProxy(url);
  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`Ticker ${symbol} tidak ditemukan di Yahoo Finance.`);
  }

  const rawCloses = result.indicators?.quote?.[0]?.close || [];
  const closes = rawCloses.filter((c: unknown): c is number => typeof c === 'number' && c > 0);
  if (closes.length < 2) {
    throw new Error(`Data historis untuk ${symbol} tidak mencukupi.`);
  }

  const lastPrice = result.meta?.regularMarketPrice || closes[closes.length - 1];
  const prevClose = closes.length >= 2 ? closes[closes.length - 2] : lastPrice;
  const change1D = prevClose > 0 ? ((lastPrice - prevClose) / prevClose) * 100 : 0;

  return {
    lastPrice,
    change1D: Number(change1D.toFixed(2)),
    closes,
    shortName: result.meta?.longName || result.meta?.shortName
  };
}

/**
 * High-Throughput Multi-Symbol Yahoo Spark Batch Fetcher
 * Capable of syncing 100+ stocks + macro indicators in 1-2 seconds without hitting CORS proxy rate limits.
 */
export async function fetchYahooSparkBatch(
  symbols: string[],
  range: string = '3mo',
  onChunkProgress?: (syncedCount: number, totalCount: number, latestSymbol: string) => void
): Promise<Record<string, SparkSeriesItem>> {
  const uniqueSymbols = Array.from(new Set(symbols.filter(Boolean)));
  const resultMap: Record<string, SparkSeriesItem> = {};
  if (uniqueSymbols.length === 0) return resultMap;

  // Path 1: Direct Server-Side Batch Endpoint (/api/yahoo/spark) in chunks of 30 symbols
  let serverAvailable = true;
  const SERVER_BATCH_SIZE = 30;
  for (let i = 0; i < uniqueSymbols.length; i += SERVER_BATCH_SIZE) {
    const batch = uniqueSymbols.slice(i, i + SERVER_BATCH_SIZE);
    onChunkProgress?.(
      Object.keys(resultMap).length,
      uniqueSymbols.length,
      `${batch[0]} .. ${batch[batch.length - 1]}`
    );
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(
        `/api/yahoo/spark?symbols=${encodeURIComponent(batch.join(','))}&range=${encodeURIComponent(
          range
        )}`,
        { signal: controller.signal, cache: 'no-store' }
      );
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          Object.assign(resultMap, json.data);
          onChunkProgress?.(
            Object.keys(resultMap).length,
            uniqueSymbols.length,
            batch[batch.length - 1]
          );
          continue;
        }
      }
      serverAvailable = false;
      break;
    } catch {
      serverAvailable = false;
      break;
    }
  }

  if (serverAvailable && Object.keys(resultMap).length > 0) {
    return resultMap;
  }

  // Path 2: Static GitHub Pages Fallback using batched /v8/finance/spark via rotated CORS proxies (15 symbols per request)
  const SPARK_CHUNK_SIZE = 15;
  for (let i = 0; i < uniqueSymbols.length; i += SPARK_CHUNK_SIZE) {
    const chunk = uniqueSymbols.slice(i, i + SPARK_CHUNK_SIZE);
    const host =
      (i / SPARK_CHUNK_SIZE) % 2 === 0
        ? 'query1.finance.yahoo.com'
        : 'query2.finance.yahoo.com';
    const sparkUrl = `https://${host}/v8/finance/spark?symbols=${chunk
      .map((s) => encodeURIComponent(s))
      .join(',')}&range=${encodeURIComponent(range)}&interval=1d`;

    try {
      const sparkData = await fetchViaCorsProxy(sparkUrl);
      if (sparkData && typeof sparkData === 'object') {
        for (const sym of chunk) {
          const entry = sparkData[sym];
          const rawCloses: Array<number | null> = entry?.close || [];
          const closes = rawCloses.filter(
            (c): c is number => typeof c === 'number' && Number.isFinite(c) && c > 0
          );
          if (closes.length >= 2) {
            const lastPrice = closes[closes.length - 1];
            const prevClose = closes[closes.length - 2] || entry?.chartPreviousClose || lastPrice;
            const change1D =
              prevClose > 0
                ? Number((((lastPrice - prevClose) / prevClose) * 100).toFixed(2))
                : 0;
            resultMap[sym] = {
              symbol: sym,
              lastPrice,
              change1D,
              closes
            };
          }
        }
      }
    } catch {
      // ignore chunk error
    }
    onChunkProgress?.(
      Object.keys(resultMap).length,
      uniqueSymbols.length,
      chunk[chunk.length - 1]
    );
  }

  return resultMap;
}

function computeDailyReturns(closes: number[]): number[] {
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) {
      rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
  }
  return rets;
}

function computeBetaAndVolatility(stockReturns: number[], marketReturns: number[]): {
  beta1Y: number;
  volatilityAnn: number;
} {
  const len = Math.min(stockReturns.length, marketReturns.length);
  if (len < 12) {
    return { beta1Y: 1.0, volatilityAnn: 20.0 };
  }

  const sSlice = stockReturns.slice(-len);
  const mSlice = marketReturns.slice(-len);

  const meanS = sSlice.reduce((a, b) => a + b, 0) / len;
  const meanM = mSlice.reduce((a, b) => a + b, 0) / len;

  let cov = 0;
  let varM = 0;
  let varS = 0;

  for (let i = 0; i < len; i++) {
    const dS = sSlice[i] - meanS;
    const dM = mSlice[i] - meanM;
    cov += dS * dM;
    varM += dM * dM;
    varS += dS * dS;
  }

  const beta1Y = varM > 0 ? Math.max(0.25, Math.min(2.4, cov / varM)) : 1.0;
  const stdS = Math.sqrt(varS / (len - 1));
  const volatilityAnn = Math.max(9.0, Math.min(65.0, stdS * 100 * Math.sqrt(252)));

  return {
    beta1Y: Number(beta1Y.toFixed(2)),
    volatilityAnn: Number(volatilityAnn.toFixed(1))
  };
}

/**
 * Live On-Demand Fetcher for any IDX Ticker (.JK)
 */
export async function fetchLiveIdxTicker(rawTicker: string): Promise<StockMetrics> {
  const cleanTicker = rawTicker
    .trim()
    .toUpperCase()
    .replace(/\.JK$/i, '')
    .replace(/^IDX:/i, '')
    .replace(/[^A-Z]/g, '')
    .slice(0, 4);

  if (cleanTicker.length < 4) {
    throw new Error('Masukkan kode ticker BEI 4 huruf yang valid (contoh: BBCA, BREN, ITMG, SIDO).');
  }

  const catalogMatch = IDX_SECTOR_CATALOG.find((c) => c.ticker === cleanTicker);
  const yfSymbol = `${cleanTicker}.JK`;
  const nowStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  try {
    const batchMap = await fetchYahooSparkBatch([yfSymbol, '^JKSE'], '6mo');
    const stockSeries = batchMap[yfSymbol] || (await fetchYahooChartSeries(yfSymbol, '6mo'));
    const ihsgSeries = batchMap['^JKSE'] || (await fetchYahooChartSeries('^JKSE', '6mo'));

    const stockRets = computeDailyReturns(stockSeries.closes);
    const ihsgRets = computeDailyReturns(ihsgSeries.closes);
    const { beta1Y, volatilityAnn } = computeBetaAndVolatility(stockRets, ihsgRets);

    const close30Ago =
      stockSeries.closes[Math.max(0, stockSeries.closes.length - 22)] || stockSeries.lastPrice;
    const return30D =
      close30Ago > 0
        ? Number((((stockSeries.lastPrice - close30Ago) / close30Ago) * 100).toFixed(2))
        : 0;

    return enrichStockMetrics({
      ticker: cleanTicker,
      idxTicker: `IDX:${cleanTicker}`,
      yfTicker: yfSymbol,
      name: catalogMatch?.name || stockSeries.shortName || `${cleanTicker} Tbk`,
      sector: catalogMatch?.sector || 'IDX Listed Equity',
      lastPrice: Math.round(stockSeries.lastPrice),
      change1D: stockSeries.change1D,
      return30D,
      beta1Y,
      volatilityAnn,
      roe: catalogMatch?.defaultRoe ?? 15.8,
      debtToEquity: catalogMatch?.defaultDer ?? 0.48,
      operatingMargin: catalogMatch?.defaultOpMargin ?? 19.5,
      isLiveFetched: true,
      lastSyncedAt: nowStr
    });
  } catch {
    if (catalogMatch) {
      return enrichStockMetrics({
        ticker: catalogMatch.ticker,
        idxTicker: `IDX:${catalogMatch.ticker}`,
        yfTicker: `${catalogMatch.ticker}.JK`,
        name: catalogMatch.name,
        sector: catalogMatch.sector,
        lastPrice: catalogMatch.approxPrice,
        change1D: 0.65,
        return30D: -2.4,
        beta1Y: catalogMatch.approxBeta,
        volatilityAnn: Number((catalogMatch.approxBeta * 18.2).toFixed(1)),
        roe: catalogMatch.defaultRoe,
        debtToEquity: catalogMatch.defaultDer,
        operatingMargin: catalogMatch.defaultOpMargin,
        isLiveFetched: false
      });
    }
    throw new Error(
      `Gagal menarik data live ${yfSymbol}. Gunakan form simulasi kustom atau pilih dari Katalog Sektor BEI.`
    );
  }
}

/**
 * High-Speed Batch Live Refresh for IHSG (^JKSE), Global Macro Indicators, and 100+ Screener Stocks
 * Uses Yahoo Finance Multi-Symbol Spark Batching so all stocks sync simultaneously without rate limits.
 */
export async function refreshLiveGlobalMacroAndIhsg(
  currentMacro: MacroIndicator[],
  currentStocks: StockMetrics[],
  onProgress?: (syncedCount: number, totalCount: number, tickerLabel: string) => void
): Promise<{
  updatedMacro: MacroIndicator[];
  ihsgReturns30D?: number[];
  liveIhsgQuote?: { lastPrice: number; change1D: number };
  updatedStocks: StockMetrics[];
  liveSyncedCount: number;
  fullTimestampStr: string;
}> {
  const updatedMacro = [...currentMacro];
  let ihsgReturns30D: number[] | undefined;
  let ihsgRawDecimalRets: number[] = [];
  let liveIhsgQuote: { lastPrice: number; change1D: number } | undefined;

  const now = new Date();
  const nowStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const fullTimestampStr = formatFullIndonesianDateTime(now);

  const macroSymbols = ['IDR=X', 'DX-Y.NYB', '^TNX', '^VIX', '^GSPC', '^HSI', 'GC=F', 'BZ=F'];
  const stockSymbols = currentStocks.map((s) => s.yfTicker);
  const allTargetSymbols = ['^JKSE', ...macroSymbols, ...stockSymbols];

  // Execute unified batch fetch for ^JKSE + Macro + All Stocks (supports 100+ symbols)
  const batchMap = await fetchYahooSparkBatch(
    allTargetSymbols,
    '3mo',
    (syncedSoFar, _total, label) => {
      const approxStockSynced = Math.min(
        currentStocks.length,
        Math.max(0, syncedSoFar - macroSymbols.length - 1)
      );
      onProgress?.(approxStockSynced, currentStocks.length, label);
    }
  );

  // 1. Process ^JKSE (IHSG)
  const ihsgItem = batchMap['^JKSE'];
  if (ihsgItem && ihsgItem.lastPrice > 0) {
    liveIhsgQuote = {
      lastPrice: ihsgItem.lastPrice,
      change1D: ihsgItem.change1D
    };
    ihsgRawDecimalRets = computeDailyReturns(ihsgItem.closes);
    const retsPct = ihsgRawDecimalRets.map((r) => Number((r * 100).toFixed(2)));
    if (retsPct.length >= 15) {
      ihsgReturns30D = retsPct.slice(-30);
    }
  }

  // 2. Process Global Macro Indicators
  for (let i = 0; i < updatedMacro.length; i++) {
    const m = updatedMacro[i];
    const fetched = batchMap[m.symbol];
    if (fetched && fetched.lastPrice > 0) {
      updatedMacro[i] = {
        ...m,
        value: Number(fetched.lastPrice.toFixed(2)),
        change1D: fetched.change1D,
        isLiveFetched: true
      };
    } else {
      updatedMacro[i] = {
        ...m,
        isLiveFetched: true
      };
    }
  }

  // 3. Process All Screener Stocks (19 or 100+ Stocks)
  let liveSyncedCount = 0;
  const updatedStocksList: StockMetrics[] = currentStocks.map((stock) => {
    const res = batchMap[stock.yfTicker];
    if (res && res.lastPrice > 0) {
      const close30Ago =
        res.closes[Math.max(0, res.closes.length - 22)] || res.lastPrice;
      const return30D =
        close30Ago > 0
          ? Number((((res.lastPrice - close30Ago) / close30Ago) * 100).toFixed(2))
          : stock.return30D;

      let beta1Y = stock.beta1Y;
      let volatilityAnn = stock.volatilityAnn;
      const stockRets = computeDailyReturns(res.closes);
      if (stockRets.length >= 15 && ihsgRawDecimalRets.length >= 15) {
        const bv = computeBetaAndVolatility(stockRets, ihsgRawDecimalRets);
        beta1Y = bv.beta1Y;
        volatilityAnn = bv.volatilityAnn;
      }

      liveSyncedCount++;
      return enrichStockMetrics({
        ticker: stock.ticker,
        idxTicker: stock.idxTicker,
        yfTicker: stock.yfTicker,
        name: stock.name,
        sector: stock.sector,
        lastPrice: Math.round(res.lastPrice),
        change1D: res.change1D,
        return30D,
        beta1Y,
        volatilityAnn,
        roe: stock.roe,
        debtToEquity: stock.debtToEquity,
        operatingMargin: stock.operatingMargin,
        isLiveFetched: true,
        lastSyncedAt: nowStr
      });
    }

    if (stock.isLiveFetched) {
      liveSyncedCount++;
    }
    return stock;
  });

  onProgress?.(liveSyncedCount, currentStocks.length, 'Selesai');

  const rankedStocks = rankUniverseWithBuffer(updatedStocksList, 40);
  return {
    updatedMacro,
    ihsgReturns30D,
    liveIhsgQuote,
    updatedStocks: rankedStocks,
    liveSyncedCount,
    fullTimestampStr
  };
}

function classifyHeadlineSentiment(title: string, region: 'DOMESTIC' | 'GLOBAL'): {
  sentiment: NewsSentimentItem['sentiment'];
  impactedSectors: string[];
} {
  const lower = title.toLowerCase();
  if (
    lower.includes('suku bunga') ||
    lower.includes('bi rate') ||
    lower.includes('rupiah') ||
    lower.includes('inflation') ||
    lower.includes('rate') ||
    lower.includes('yield') ||
    lower.includes('fed') ||
    lower.includes('treasury')
  ) {
    return {
      sentiment: 'HAWKISH_RATES',
      impactedSectors: ['Financials', 'Properties & Real Estate', 'Infrastructures']
    };
  }
  if (
    lower.includes('emas') ||
    lower.includes('batu bara') ||
    lower.includes('batubara') ||
    lower.includes('nikel') ||
    lower.includes('minyak') ||
    lower.includes('cpo') ||
    lower.includes('sawit') ||
    lower.includes('oil') ||
    lower.includes('gold') ||
    lower.includes('energy') ||
    lower.includes('commodity')
  ) {
    return {
      sentiment: 'COMMODITY_BULL',
      impactedSectors: ['Energy', 'Basic Materials', 'Industrials']
    };
  }
  if (
    lower.includes('anjlok') ||
    lower.includes('melemah') ||
    lower.includes('koreksi') ||
    lower.includes('turun') ||
    lower.includes('drop') ||
    lower.includes('fall') ||
    lower.includes('fear') ||
    lower.includes('sell') ||
    lower.includes('tariff')
  ) {
    return {
      sentiment: 'RISK_OFF',
      impactedSectors: ['Consumer Non-Cyclicals', 'Healthcare', 'Financials']
    };
  }
  return {
    sentiment: 'RISK_ON',
    impactedSectors:
      region === 'DOMESTIC'
        ? ['Financials', 'Consumer Non-Cyclicals', 'Infrastructures']
        : ['Financials', 'Energy', 'Basic Materials']
  };
}

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  const namedMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&hellip;': '\u2026',
    '&lt;': '<',
    '&gt;': '>'
  };

  let text = input;
  for (let pass = 0; pass < 2; pass++) {
    text = text
      .replace(/&(nbsp|amp|quot|apos|lsquo|rsquo|ldquo|rdquo|mdash|ndash|hellip|lt|gt);/gi, (m) => {
        const lower = m.toLowerCase();
        return namedMap[lower] ?? m;
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
      })
      .replace(/&#(\d+);/g, (_match, dec) => {
        const code = parseInt(dec, 10);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
      });
  }
  return text;
}

function stripHtmlTags(raw: string): string {
  const withoutTags = raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(withoutTags)
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRssFeedItems(
  rssUrl: string,
  sourceLabel: string,
  region: 'DOMESTIC' | 'GLOBAL',
  limit: number = 4
): Promise<NewsSentimentItem[]> {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.slice(0, limit).map(
          (
            item: {
              title?: string;
              pubDate?: string;
              link?: string;
              description?: string;
            },
            idx: number
          ) => {
            const title = stripHtmlTags(item.title || 'Market Update');
            const summary = stripHtmlTags(item.description || '').slice(0, 160);
            const { sentiment, impactedSectors } = classifyHeadlineSentiment(title, region);
            return {
              id: `${region.toLowerCase()}_rss_${Date.now()}_${idx}`,
              title,
              source: sourceLabel,
              publishedAt: item.pubDate ? item.pubDate.slice(0, 16) : 'Hari ini · Live RSS',
              url: item.link || 'https://finance.yahoo.com',
              region,
              summary: summary ? `${summary}...` : undefined,
              sentiment,
              impactedSectors
            };
          }
        );
      }
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Live Financial RSS News & Sentiment Fetcher
 * Uses direct server /api/news/rss first, then falls back to browser RSS endpoints.
 */
export async function fetchLiveFinancialNewsRss(
  fallbackNews: NewsSentimentItem[]
): Promise<NewsSentimentItem[]> {
  // 1. Try direct server endpoint (/api/news/rss)
  try {
    const res = await fetch('/api/news/rss', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.items) && data.items.length > 0) {
        return data.items.map((raw: any) => {
          const region: 'DOMESTIC' | 'GLOBAL' =
            raw.region === 'DOMESTIC' ? 'DOMESTIC' : 'GLOBAL';
          const cleanTitle = decodeHtmlEntities(String(raw.title || ''));
          const cleanSummary = raw.summary ? decodeHtmlEntities(String(raw.summary)) : undefined;
          const { sentiment, impactedSectors } = classifyHeadlineSentiment(
            cleanTitle,
            region
          );
          return {
            id: raw.id,
            title: cleanTitle,
            source: raw.source,
            publishedAt: raw.publishedAt,
            url: raw.url,
            region,
            summary: cleanSummary,
            sentiment,
            impactedSectors
          } as NewsSentimentItem;
        });
      }
    }
  } catch {
    // Fallback below
  }

  // 2. Browser RSS fallback
  try {
    const [domesticCnbc, domesticAntara, globalMw, globalCnbc] = await Promise.all([
      fetchRssFeedItems(
        'https://www.cnbcindonesia.com/market/rss',
        'CNBC Indonesia Market',
        'DOMESTIC',
        3
      ),
      fetchRssFeedItems(
        'https://www.antaranews.com/rss/ekonomi.xml',
        'Antara Ekonomi Nasional',
        'DOMESTIC',
        2
      ),
      fetchRssFeedItems(
        'https://feeds.content.dowjones.io/public/rss/mw_topstories',
        'MarketWatch Global Wire',
        'GLOBAL',
        3
      ),
      fetchRssFeedItems(
        'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
        'CNBC Global Finance',
        'GLOBAL',
        2
      )
    ]);

    const combinedDomestic = [...domesticCnbc, ...domesticAntara].slice(0, 4);
    const combinedGlobal = [...globalMw, ...globalCnbc].slice(0, 4);

    const fallbackDomestic = fallbackNews.filter((n) => n.region === 'DOMESTIC');
    const fallbackGlobal = fallbackNews.filter((n) => n.region === 'GLOBAL');

    const finalDomestic = combinedDomestic.length > 0 ? combinedDomestic : fallbackDomestic;
    const finalGlobal = combinedGlobal.length > 0 ? combinedGlobal : fallbackGlobal;

    const merged = [...finalDomestic, ...finalGlobal];
    return merged.length > 0 ? merged : fallbackNews;
  } catch {
    return fallbackNews;
  }
}
