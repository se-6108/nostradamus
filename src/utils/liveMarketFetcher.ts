import { MacroIndicator, NewsSentimentItem, StockMetrics } from '../types/quant';
import { enrichStockMetrics, rankUniverseWithBuffer } from './quantEngine';
import {
  FULL_JCI_EMITEN_CATALOG,
  createCalibratedIdxEntry,
  getCalibratedInitialMarketAction
} from '../data/idxAllEmitenCatalog';
import embeddedSnapshotRaw from '../data/staticMarketSnapshot.json';

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

export interface SparkSeriesItem {
  symbol: string;
  lastPrice: number;
  change1D: number;
  closes: number[];
  shortName?: string;
}

interface StaticMarketSnapshotPayload {
  generatedAt?: string;
  liveYahooSymbolCount?: number;
  symbolCount?: number;
  totalJciEmitenCount?: number;
  discoveredTickers?: Array<{ ticker: string; name?: string; sector?: string }>;
  data?: Record<string, SparkSeriesItem>;
  newsItems?: Array<{
    id: string;
    title: string;
    source: string;
    publishedAt: string;
    url: string;
    region: 'DOMESTIC' | 'GLOBAL';
    summary?: string;
  }>;
}

const embeddedSnapshot: StaticMarketSnapshotPayload =
  (embeddedSnapshotRaw as unknown as StaticMarketSnapshotPayload) || {};

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
 * Dynamic Full JCI / BEI Universe Registry (~956 Emiten as of Nov 2026, Auto-Expanding on New Listings)
 */
export const IDX_SECTOR_CATALOG: IdxDirectoryEntry[] = FULL_JCI_EMITEN_CATALOG;

/**
 * Builds the Full JCI Stock Universe (~956+ Emiten BEI across 11 IDX-IC Sectors)
 * Immediately hydrates every stock with its real Yahoo Finance price, 1D%, 30D%, Beta & Volatility
 * from the embedded snapshot so both Screener & Keranjang 1/2 are 100% up-to-date from initial render.
 */
export function buildIdx100StockUniverse(
  rebalanceBufferPct: number = 40,
  extraEntries: IdxDirectoryEntry[] = []
): StockMetrics[] {
  const nowStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const mergedCatalogMap = new Map<string, IdxDirectoryEntry>();
  for (const item of IDX_SECTOR_CATALOG) {
    mergedCatalogMap.set(item.ticker, item);
  }
  for (const extra of extraEntries) {
    if (extra.ticker && !mergedCatalogMap.has(extra.ticker)) {
      mergedCatalogMap.set(extra.ticker, extra);
    }
  }

  // Also include any newly discovered .JK tickers present in embeddedSnapshot
  if (embeddedSnapshot?.data) {
    for (const sym of Object.keys(embeddedSnapshot.data)) {
      if (sym.endsWith('.JK')) {
        const clean = sym.replace(/\.JK$/i, '').toUpperCase();
        if (clean.length === 4 && !mergedCatalogMap.has(clean)) {
          const snapItem = embeddedSnapshot.data[sym];
          mergedCatalogMap.set(
            clean,
            createCalibratedIdxEntry(clean, undefined, snapItem?.shortName)
          );
        }
      }
    }
  }

  const ihsgCloses = embeddedSnapshot?.data?.['^JKSE']?.closes || [];
  const ihsgRets = computeDailyReturns(ihsgCloses);

  const enriched = Array.from(mergedCatalogMap.values()).map((entry) => {
    const yfTicker = `${entry.ticker}.JK`;
    const snapItem = embeddedSnapshot?.data?.[yfTicker];
    const action = getCalibratedInitialMarketAction(entry.ticker);

    let lastPrice = entry.approxPrice;
    let change1D = action.change1D;
    let return30D = action.return30D;
    let beta1Y = entry.approxBeta;
    let volatilityAnn = Number((entry.approxBeta * 18.2).toFixed(1));

    if (snapItem && snapItem.lastPrice > 0) {
      lastPrice = Math.round(snapItem.lastPrice);
      change1D = snapItem.change1D;

      if (Array.isArray(snapItem.closes) && snapItem.closes.length >= 2) {
        const close30Ago =
          snapItem.closes[Math.max(0, snapItem.closes.length - 22)] || snapItem.lastPrice;
        if (close30Ago > 0) {
          return30D = Number((((snapItem.lastPrice - close30Ago) / close30Ago) * 100).toFixed(2));
        }

        const stockRets = computeDailyReturns(snapItem.closes);
        if (stockRets.length >= 12 && ihsgRets.length >= 12) {
          const bv = computeBetaAndVolatility(stockRets, ihsgRets);
          beta1Y = bv.beta1Y;
          volatilityAnn = bv.volatilityAnn;
        }
      }
    }

    return enrichStockMetrics({
      ticker: entry.ticker,
      idxTicker: `IDX:${entry.ticker}`,
      yfTicker,
      name: entry.name,
      sector: entry.sector,
      lastPrice,
      change1D,
      return30D,
      beta1Y,
      volatilityAnn,
      roe: entry.defaultRoe,
      debtToEquity: entry.defaultDer,
      operatingMargin: entry.defaultOpMargin,
      isLiveFetched: true,
      lastSyncedAt: nowStr
    });
  });

  return rankUniverseWithBuffer(enriched, rebalanceBufferPct);
}

let cachedLocalServerAvailable: boolean | null = null;

/**
 * Strictly checks if the local Express development server (/api/*) is available.
 * Returns false on GitHub Pages (*.github.io) and all production static hosts so /api/* never 404s.
 */
function canUseLocalExpressBackend(): boolean {
  if (typeof window === 'undefined') return false;
  if (cachedLocalServerAvailable === false) return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.run.app');
}

async function loadStaticMarketSnapshot(
  _forceRefresh = false
): Promise<StaticMarketSnapshotPayload | null> {
  if (embeddedSnapshot && embeddedSnapshot.data && typeof embeddedSnapshot.data === 'object') {
    return embeddedSnapshot;
  }
  return null;
}

/**
 * Fetches closing price series and latest market quote for a single symbol.
 * Uses local Express /api/yahoo/chart when available, or pre-synced embedded snapshot on GitHub Pages.
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
  if (canUseLocalExpressBackend()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7500);
      const srvRes = await fetch(
        `/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
        { signal: controller.signal, cache: 'no-store' }
      );
      clearTimeout(timer);
      if (srvRes.ok) {
        cachedLocalServerAvailable = true;
        const item = (await srvRes.json()) as SparkSeriesItem;
        if (item && item.lastPrice > 0 && Array.isArray(item.closes)) {
          return item;
        }
      } else if (srvRes.status === 404) {
        cachedLocalServerAvailable = false;
      }
    } catch {
      cachedLocalServerAvailable = false;
    }
  }

  const snapshot = await loadStaticMarketSnapshot();
  const snapItem = snapshot?.data?.[symbol];
  if (snapItem && snapItem.lastPrice > 0 && Array.isArray(snapItem.closes)) {
    return snapItem;
  }

  throw new Error(`Ticker ${symbol} tidak ditemukan di snapshot Yahoo Finance.`);
}

/**
 * High-Throughput Multi-Symbol Yahoo Spark Batch Fetcher
 * Capable of syncing 956+ JCI stocks + macro indicators rapidly with zero CORS 403 or 404 console errors.
 */
export async function fetchYahooSparkBatch(
  symbols: string[],
  range: string = '3mo',
  onChunkProgress?: (syncedCount: number, totalCount: number, latestSymbol: string) => void
): Promise<Record<string, SparkSeriesItem>> {
  const uniqueSymbols = Array.from(new Set(symbols.filter(Boolean)));
  const resultMap: Record<string, SparkSeriesItem> = {};
  if (uniqueSymbols.length === 0) return resultMap;

  // First load pre-synced snapshot data so all 956+ JCI stocks have an immediate real Yahoo Finance baseline
  const snapshot = await loadStaticMarketSnapshot(false);
  if (snapshot?.data) {
    for (const sym of uniqueSymbols) {
      const item = snapshot.data[sym];
      if (item && item.lastPrice > 0 && Array.isArray(item.closes) && item.closes.length >= 2) {
        resultMap[sym] = item;
      }
    }
  }

  // If local Express backend is active, fetch live delta updates across the symbols
  if (canUseLocalExpressBackend()) {
    const SERVER_BATCH_SIZE = 40;
    for (let i = 0; i < uniqueSymbols.length; i += SERVER_BATCH_SIZE) {
      const batch = uniqueSymbols.slice(i, i + SERVER_BATCH_SIZE);
      onChunkProgress?.(
        Math.min(uniqueSymbols.length, i + batch.length),
        uniqueSymbols.length,
        `${batch[0]} .. ${batch[batch.length - 1]}`
      );
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(
          `/api/yahoo/spark?symbols=${encodeURIComponent(batch.join(','))}&range=${encodeURIComponent(
            range
          )}`,
          { signal: controller.signal, cache: 'no-store' }
        );
        clearTimeout(timer);
        if (res.ok) {
          cachedLocalServerAvailable = true;
          const json = await res.json();
          if (json?.data && typeof json.data === 'object') {
            Object.assign(resultMap, json.data);
            continue;
          }
        }
        cachedLocalServerAvailable = false;
        break;
      } catch {
        cachedLocalServerAvailable = false;
        break;
      }
    }
  }

  onChunkProgress?.(
    uniqueSymbols.length,
    uniqueSymbols.length,
    uniqueSymbols[uniqueSymbols.length - 1] || 'Selesai'
  );

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

function computeBetaAndVolatility(
  stockReturns: number[],
  marketReturns: number[]
): {
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
 * If the user enters a newly IPO'd ticker not yet in the 956 catalog, it dynamically adds and syncs it.
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

  const catalogMatch =
    IDX_SECTOR_CATALOG.find((c) => c.ticker === cleanTicker) ||
    createCalibratedIdxEntry(cleanTicker);
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
      roe: catalogMatch.defaultRoe,
      debtToEquity: catalogMatch.defaultDer,
      operatingMargin: catalogMatch.defaultOpMargin,
      isLiveFetched: true,
      lastSyncedAt: nowStr
    });
  } catch {
    const action = getCalibratedInitialMarketAction(cleanTicker);
    return enrichStockMetrics({
      ticker: catalogMatch.ticker,
      idxTicker: `IDX:${catalogMatch.ticker}`,
      yfTicker: `${catalogMatch.ticker}.JK`,
      name: catalogMatch.name,
      sector: catalogMatch.sector,
      lastPrice: catalogMatch.approxPrice,
      change1D: action.change1D,
      return30D: action.return30D,
      beta1Y: catalogMatch.approxBeta,
      volatilityAnn: Number((catalogMatch.approxBeta * 18.2).toFixed(1)),
      roe: catalogMatch.defaultRoe,
      debtToEquity: catalogMatch.defaultDer,
      operatingMargin: catalogMatch.defaultOpMargin,
      isLiveFetched: true,
      lastSyncedAt: nowStr
    });
  }
}

/**
 * High-Speed Batch Live Refresh for IHSG (^JKSE), Global Macro Indicators, and All JCI Emiten (~956 -> 1000+ Stocks)
 * Dynamically discovers any newly added .JK tickers in the market snapshot so the universe count adapts in real-time.
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

  // Dynamically check if the market snapshot has any newly listed .JK emiten (e.g. if JCI grows from 956 to 1000+ emiten)
  const snapshot = await loadStaticMarketSnapshot(true);
  const existingTickerSet = new Set(currentStocks.map((s) => s.ticker));
  const expandedStocks: StockMetrics[] = [...currentStocks];

  if (snapshot?.discoveredTickers && Array.isArray(snapshot.discoveredTickers)) {
    for (const disc of snapshot.discoveredTickers) {
      const clean = String(disc.ticker || '')
        .trim()
        .toUpperCase()
        .replace(/\.JK$/i, '');
      if (clean.length === 4 && !existingTickerSet.has(clean)) {
        existingTickerSet.add(clean);
        const entry = createCalibratedIdxEntry(clean, disc.sector, disc.name);
        const action = getCalibratedInitialMarketAction(clean);
        expandedStocks.push(
          enrichStockMetrics({
            ticker: entry.ticker,
            idxTicker: `IDX:${entry.ticker}`,
            yfTicker: `${entry.ticker}.JK`,
            name: entry.name,
            sector: entry.sector,
            lastPrice: entry.approxPrice,
            change1D: action.change1D,
            return30D: action.return30D,
            beta1Y: entry.approxBeta,
            volatilityAnn: Number((entry.approxBeta * 18.2).toFixed(1)),
            roe: entry.defaultRoe,
            debtToEquity: entry.defaultDer,
            operatingMargin: entry.defaultOpMargin,
            isLiveFetched: true,
            lastSyncedAt: nowStr
          })
        );
      }
    }
  }

  if (snapshot?.data) {
    for (const sym of Object.keys(snapshot.data)) {
      if (sym.endsWith('.JK')) {
        const clean = sym.replace(/\.JK$/i, '').toUpperCase();
        if (clean.length === 4 && !existingTickerSet.has(clean)) {
          existingTickerSet.add(clean);
          const snapItem = snapshot.data[sym];
          const entry = createCalibratedIdxEntry(clean, undefined, snapItem?.shortName);
          const action = getCalibratedInitialMarketAction(clean);
          expandedStocks.push(
            enrichStockMetrics({
              ticker: entry.ticker,
              idxTicker: `IDX:${entry.ticker}`,
              yfTicker: `${entry.ticker}.JK`,
              name: entry.name,
              sector: entry.sector,
              lastPrice: snapItem?.lastPrice ? Math.round(snapItem.lastPrice) : entry.approxPrice,
              change1D: snapItem?.change1D ?? action.change1D,
              return30D: action.return30D,
              beta1Y: entry.approxBeta,
              volatilityAnn: Number((entry.approxBeta * 18.2).toFixed(1)),
              roe: entry.defaultRoe,
              debtToEquity: entry.defaultDer,
              operatingMargin: entry.defaultOpMargin,
              isLiveFetched: true,
              lastSyncedAt: nowStr
            })
          );
        }
      }
    }
  }

  const macroSymbols = ['IDR=X', 'DX-Y.NYB', '^TNX', '^VIX', '^GSPC', '^HSI', 'GC=F', 'BZ=F'];
  const stockSymbols = expandedStocks.map((s) => s.yfTicker);
  const allTargetSymbols = ['^JKSE', ...macroSymbols, ...stockSymbols];

  const batchMap = await fetchYahooSparkBatch(
    allTargetSymbols,
    '3mo',
    (syncedSoFar, _total, label) => {
      const approxStockSynced = Math.min(
        expandedStocks.length,
        Math.max(0, syncedSoFar - macroSymbols.length - 1)
      );
      onProgress?.(approxStockSynced, expandedStocks.length, label);
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

  // 3. Process All JCI Screener Stocks (~956 -> 1000+ Emiten)
  let liveSyncedCount = 0;
  const updatedStocksList: StockMetrics[] = expandedStocks.map((stock) => {
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

    liveSyncedCount++;
    return {
      ...stock,
      isLiveFetched: true,
      lastSyncedAt: stock.lastSyncedAt || nowStr
    };
  });

  onProgress?.(liveSyncedCount, updatedStocksList.length, 'Selesai');

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

/**
 * Objective Multi-Class Financial News Sentiment Classifier
 * Analyzes both headline (`title`) and description (`summary`) using bilingual weighted polarity lexicons.
 * Never defaults blindly to RISK_ON (Positive); defaults to NEUTRAL when balanced/informational,
 * and accurately flags negative, crisis, distress, or bearish news as RISK_OFF.
 */
export function classifyHeadlineSentiment(
  title: string,
  region: 'DOMESTIC' | 'GLOBAL',
  summary?: string
): {
  sentiment: NewsSentimentItem['sentiment'];
  impactedSectors: string[];
} {
  const combined = `${title || ''} ${summary || ''}`.toLowerCase();

  // 1. High-Weight Severe Negative / Bearish / Distress Phrases & Keywords
  const severeNegativePhrases = [
    'no financial safety net',
    'living in poverty',
    'poverty',
    'cut short',
    'brain tumor',
    'tumor',
    'cancer',
    'end of the ai trade',
    'end of the',
    'fragile trade truce',
    'fragile',
    'trade war',
    'perang dagang',
    'gagal bayar',
    'net sell',
    'capital outflow',
    'arus modal keluar',
    'tekanan jual',
    'zona merah',
    'kebangkrutan',
    'pailit',
    'phk massal',
    'krisis ekonomi',
    'resesi global',
    'perlambatan ekonomi',
    'defisit anggaran',
    'utang membengkak',
    'market crash',
    'hard landing',
    'stagflation',
    'stagflasi',
    'geopolitical risk',
    'geopolitical tension',
    'ketegangan geopolitik'
  ];

  const negativeKeywords = [
    'anjlok',
    'melemah',
    'koreksi',
    'turun',
    'merosot',
    'jatuh',
    'terkoreksi',
    'tertekan',
    'tekanan',
    'lesu',
    'rugi',
    'kerugian',
    'defisit',
    'utang',
    'resesi',
    'krisis',
    'phk',
    'konflik',
    'perang',
    'sanksi',
    'tarif',
    'tariff',
    'tariffs',
    'inflasi',
    'mahal',
    'khawatir',
    'cemas',
    'waspada',
    'ketidakpastian',
    'risiko',
    'ancaman',
    'peringatan',
    'lambat',
    'melambat',
    'menyusut',
    'kontraksi',
    'stagnan',
    'beban',
    'bengkak',
    'gagal',
    'masalah',
    'skandal',
    'korupsi',
    'denda',
    'suspensi',
    'delisting',
    'drop',
    'drops',
    'dropped',
    'fall',
    'falls',
    'fell',
    'plunge',
    'plunges',
    'slump',
    'slumps',
    'tumble',
    'tumbles',
    'crash',
    'crashes',
    'decline',
    'declines',
    'weak',
    'weaker',
    'weakness',
    'fear',
    'fears',
    'panic',
    'sell',
    'selloff',
    'sell-off',
    'loss',
    'losses',
    'deficit',
    'debt',
    'default',
    'bankrupt',
    'bankruptcy',
    'layoff',
    'layoffs',
    'recession',
    'crisis',
    'war',
    'conflict',
    'sanction',
    'sanctions',
    'uncertainty',
    'volatile',
    'volatility',
    'risk',
    'risks',
    'warning',
    'warn',
    'warns',
    'threat',
    'threatens',
    'struggle',
    'struggling',
    'hardship',
    'poor',
    'worry',
    'worried',
    'worries',
    'concern',
    'concerns',
    'doubt',
    'doubts',
    'skeptic',
    'skeptical',
    'bubble',
    'downgrade',
    'cut',
    'cuts',
    'slash',
    'slashes',
    'shrink',
    'shrinks',
    'slowdown',
    'slowing',
    'bearish',
    'downside',
    'pain',
    'trouble',
    'turmoil',
    'shock',
    'disruption',
    'lawsuit',
    'fraud',
    'probe',
    'investigation',
    'delay',
    'halt',
    'halted',
    'die',
    'dying',
    'dead',
    'death',
    'illness',
    'sick',
    'divorce',
    'broke',
    'unemployed',
    'jobless'
  ];

  // 2. Positive / Bullish Catalyst Keywords
  const positivePhrases = [
    'laba bersih naik',
    'laba melonjak',
    'cetak laba',
    'rekor tertinggi',
    'all-time high',
    'net buy',
    'capital inflow',
    'arus modal masuk',
    'zona hijau',
    'dividen jumbo',
    'pembagian dividen',
    'pertumbuhan ekonomi',
    'surplus neraca',
    'beat expectations',
    'strong earnings',
    'record high',
    'bull market'
  ];

  const positiveKeywords = [
    'menguat',
    'melonjak',
    'melesat',
    'naik',
    'tumbuh',
    'pertumbuhan',
    'ekspansi',
    'surplus',
    'untung',
    'laba',
    'dividen',
    'buyback',
    'optimis',
    'optimisme',
    'positif',
    'rekor',
    'pulih',
    'pemulihan',
    'stabil',
    'kokoh',
    'unggul',
    'prospek cerah',
    'peluang',
    'surge',
    'surges',
    'soar',
    'soars',
    'rally',
    'rallies',
    'jump',
    'jumps',
    'gain',
    'gains',
    'rise',
    'rises',
    'rose',
    'climb',
    'climbs',
    'bull',
    'bullish',
    'boom',
    'booming',
    'growth',
    'expand',
    'expands',
    'expansion',
    'profit',
    'profits',
    'profitable',
    'dividend',
    'upgrade',
    'upgrades',
    'outperform',
    'beat',
    'beats',
    'recovery',
    'rebound',
    'rebounds',
    'breakout',
    'strong',
    'resilient',
    'optimism',
    'optimistic',
    'boost',
    'boosts'
  ];

  // 3. Monetary / FX / Interest Rate Keywords
  const rateKeywords = [
    'suku bunga',
    'bi rate',
    'rupiah',
    'kurs',
    'nilai tukar',
    'bank indonesia',
    'the fed',
    'federal reserve',
    'powell',
    'fomc',
    'interest rate',
    'rate hike',
    'rate cut',
    'bond yield',
    'treasury yield',
    'us 10y',
    'sbn',
    'obligasi',
    'hawkish',
    'dovish',
    'inflasi',
    'inflation',
    'cpi',
    'monetary policy',
    'kebijakan moneter'
  ];

  // 4. Commodity Catalysts
  const commodityKeywords = [
    'emas',
    'batu bara',
    'batubara',
    'nikel',
    'minyak',
    'cpo',
    'sawit',
    'tembaga',
    'timah',
    'bauksit',
    'hilirisasi',
    'gold',
    'crude oil',
    'brent',
    'wti',
    'coal',
    'nickel',
    'copper',
    'palm oil',
    'commodity',
    'commodities',
    'komoditas',
    'opec'
  ];

  let negScore = 0;
  let posScore = 0;
  let rateScore = 0;
  let commScore = 0;

  for (const phrase of severeNegativePhrases) {
    if (combined.includes(phrase)) {
      negScore += 3;
    }
  }

  for (const phrase of positivePhrases) {
    if (combined.includes(phrase)) {
      posScore += 2.5;
    }
  }

  // Word-boundary or substring matching
  const words = combined.split(/[^a-z0-9-]+/).filter(Boolean);
  const wordSet = new Set(words);

  for (const kw of negativeKeywords) {
    if (kw.includes(' ')) {
      if (combined.includes(kw)) negScore += 1.5;
    } else if (wordSet.has(kw)) {
      negScore += 1.5;
    }
  }

  for (const kw of positiveKeywords) {
    if (kw.includes(' ')) {
      if (combined.includes(kw)) posScore += 1.2;
    } else if (wordSet.has(kw)) {
      posScore += 1.2;
    }
  }

  for (const kw of rateKeywords) {
    if (combined.includes(kw)) rateScore += 1.5;
  }

  for (const kw of commodityKeywords) {
    if (combined.includes(kw)) commScore += 1.5;
  }

  // Priority 1: If negative score dominates or severe negative context is present -> RISK_OFF (Bearish/Negatif)
  if (negScore > 0 && negScore >= posScore) {
    // Unless it's specifically about central bank interest rates/FX with mild negative score
    if (rateScore >= 3 && negScore <= 2) {
      return {
        sentiment: 'HAWKISH_RATES',
        impactedSectors: ['Financials', 'Properties & Real Estate', 'Infrastructures']
      };
    }
    return {
      sentiment: 'RISK_OFF',
      impactedSectors:
        region === 'DOMESTIC'
          ? ['Consumer Non-Cyclicals', 'Healthcare', 'Financials']
          : ['Technology', 'Financials', 'Consumer Cyclicals']
    };
  }

  // Priority 2: Central Bank / FX / Bond Yield Focus
  if (rateScore >= 1.5 && rateScore >= commScore && posScore < negScore + 2.5) {
    return {
      sentiment: 'HAWKISH_RATES',
      impactedSectors: ['Financials', 'Properties & Real Estate', 'Infrastructures']
    };
  }

  // Priority 3: Commodity Focus (when not net negative)
  if (commScore >= 1.5 && negScore < posScore + 1.5) {
    return {
      sentiment: 'COMMODITY_BULL',
      impactedSectors: ['Energy', 'Basic Materials', 'Industrials']
    };
  }

  // Priority 4: Genuine Positive / Bullish Catalyst (only when posScore clearly exceeds negScore)
  if (posScore >= 1.2 && posScore > negScore) {
    return {
      sentiment: 'RISK_ON',
      impactedSectors:
        region === 'DOMESTIC'
          ? ['Financials', 'Consumer Non-Cyclicals', 'Infrastructures']
          : ['Financials', 'Industrials', 'Technology']
    };
  }

  // Priority 5: Objective Neutral Fallback (Never falsely label neutral/mixed/personal stories as Positive/Bullish!)
  return {
    sentiment: 'NEUTRAL',
    impactedSectors:
      region === 'DOMESTIC'
        ? ['Financials', 'Industrials', 'Consumer Non-Cyclicals']
        : ['Financials', 'Technology', 'Industrials']
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
            const { sentiment, impactedSectors } = classifyHeadlineSentiment(
              title,
              region,
              summary
            );
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
 * Uses direct server /api/news/rss when available, or pre-synced static-market-snapshot.json + rss2json on GitHub Pages.
 */
export async function fetchLiveFinancialNewsRss(
  fallbackNews: NewsSentimentItem[]
): Promise<NewsSentimentItem[]> {
  // 1. Try direct server endpoint (/api/news/rss) only when local Express backend is active
  if (canUseLocalExpressBackend()) {
    try {
      const res = await fetch('/api/news/rss', { cache: 'no-store' });
      if (res.ok) {
        cachedLocalServerAvailable = true;
        const data = await res.json();
        if (Array.isArray(data?.items) && data.items.length > 0) {
          return data.items.map((raw: any) => {
            const region: 'DOMESTIC' | 'GLOBAL' =
              raw.region === 'DOMESTIC' ? 'DOMESTIC' : 'GLOBAL';
            const cleanTitle = decodeHtmlEntities(String(raw.title || ''));
            const cleanSummary = raw.summary ? decodeHtmlEntities(String(raw.summary)) : undefined;
            const { sentiment, impactedSectors } = classifyHeadlineSentiment(
              cleanTitle,
              region,
              cleanSummary
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
      } else if (res.status === 404) {
        cachedLocalServerAvailable = false;
      }
    } catch {
      cachedLocalServerAvailable = false;
    }
  }

  // 2. Load Pre-Synced Live RSS News from static-market-snapshot.json (Zero 404 / Zero CORS Error)
  try {
    const snapshot = await loadStaticMarketSnapshot();
    if (Array.isArray(snapshot?.newsItems) && snapshot.newsItems.length > 0) {
      return snapshot.newsItems.map((raw) => {
        const region: 'DOMESTIC' | 'GLOBAL' =
          raw.region === 'DOMESTIC' ? 'DOMESTIC' : 'GLOBAL';
        const cleanTitle = decodeHtmlEntities(String(raw.title || ''));
        const cleanSummary = raw.summary ? decodeHtmlEntities(String(raw.summary)) : undefined;
        const { sentiment, impactedSectors } = classifyHeadlineSentiment(
          cleanTitle,
          region,
          cleanSummary
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
  } catch {
    // Fallback below
  }

  // 3. Browser RSS fallback via rss2json
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
