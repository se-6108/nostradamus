import { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  CloudStateBundle,
  GitHubCloudConfig,
  MacroIndicator,
  MarketRegime,
  NewsSentimentItem,
  PortfolioHolding,
  StockMetrics,
  WorkspaceTabId
} from './types/quant';
import {
  buildQuantStockList,
  CALM_GLOBAL_MACRO,
  CALM_IHSG_30D_RETURNS,
  computeMarketRegime,
  computeOptimalHRPBarbellPortfolio,
  DEFAULT_GLOBAL_MACRO,
  DEFAULT_NEWS_SENTIMENT,
  DEFAULT_USER_PORTFOLIO_HOLDINGS,
  rankUniverseWithBuffer,
  REAL_IHSG_30D_RETURNS
} from './utils/quantEngine';
import {
  buildIdx100StockUniverse,
  fetchLiveFinancialNewsRss,
  formatFullIndonesianDateTime,
  refreshLiveGlobalMacroAndIhsg
} from './utils/liveMarketFetcher';
import {
  isGitHubCloudConfigured,
  loadGitHubCloudConfig,
  pullStateFromGitHubRepo,
  pushStateToGitHubRepo,
  saveGitHubCloudConfig
} from './utils/githubCloudSync';
import { Header } from './components/Header';
import { GlobalMacroPulse } from './components/GlobalMacroPulse';
import { MarketRegimeBanner } from './components/MarketRegimeBanner';
import { BarbellAllocatorCard } from './components/BarbellAllocatorCard';
import { ActivePortfolioManager } from './components/ActivePortfolioManager';
import { ScreeningTable } from './components/ScreeningTable';
import { MarketNewsSentiment } from './components/MarketNewsSentiment';
import { SkepticalBacktestLab } from './components/SkepticalBacktestLab';
import { ArchitectureVault } from './components/ArchitectureVault';
import { GitHubCloudSyncModal } from './components/GitHubCloudSyncModal';
import { Sun, Moon, Cloud, RefreshCw } from 'lucide-react';

const SCREENER_CACHE_KEY = 'nostradamus_dmu24_screener_v5_jci956';
const PORTFOLIO_CACHE_KEY = 'nostradamus_dmu24_portfolio_v4';
const THEME_CACHE_KEY = 'nostradamus_theme_mode_v1';

interface ScreenerCachePayload {
  savedAt: string;
  fullDateTimeStr?: string;
  stocks: StockMetrics[];
  macroIndicators: MacroIndicator[];
  liveIhsgQuote: { lastPrice: number; change1D: number };
  liveIhsgReturns: number[];
}

interface PortfolioCachePayload {
  savedAt: string;
  holdings: PortfolioHolding[];
  cashReserveIdr: number;
  rebalanceBufferPct?: number;
  capitalIdr?: number;
}

function loadScreenerCache(): ScreenerCachePayload | null {
  try {
    const raw = localStorage.getItem(SCREENER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScreenerCachePayload;
    if (
      Array.isArray(parsed.stocks) &&
      parsed.stocks.length >= 900 &&
      typeof parsed.stocks[0].dmuCompositeScore === 'number' &&
      parsed.liveIhsgQuote?.lastPrice
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function loadPortfolioCache(): PortfolioCachePayload | null {
  try {
    const raw = localStorage.getItem(PORTFOLIO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortfolioCachePayload;
    if (Array.isArray(parsed.holdings)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function loadInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(THEME_CACHE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'dark';
}

export default function App() {
  const initialScreenerCache = loadScreenerCache();
  const initialPortfolioCache = loadPortfolioCache();

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(loadInitialTheme);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('command');
  const [showDeployKitModal, setShowDeployKitModal] = useState<boolean>(false);
  const [activeVaultTab, setActiveVaultTab] = useState<'methodology' | 'github' | 'pipeline'>(
    'methodology'
  );

  // Multifactor + 40% Rebalancing Buffer State
  const [isCalmSim, setIsCalmSim] = useState<boolean>(false);
  const [thresholdAnnVol, setThresholdAnnVol] = useState<number>(18.0);
  const [rebalanceBufferPct, setRebalanceBufferPct] = useState<number>(
    () => initialPortfolioCache?.rebalanceBufferPct ?? 40
  );
  const [capitalIdr, setCapitalIdr] = useState<number>(
    () => initialPortfolioCache?.capitalIdr ?? 100000000
  );

  const [macroIndicators, setMacroIndicators] = useState<MacroIndicator[]>(
    () => initialScreenerCache?.macroIndicators || DEFAULT_GLOBAL_MACRO
  );
  const [liveIhsgQuote, setLiveIhsgQuote] = useState<{ lastPrice: number; change1D: number }>(
    () =>
      initialScreenerCache?.liveIhsgQuote || {
        lastPrice: 5034.43,
        change1D: 2.33
      }
  );
  const [liveIhsgReturns, setLiveIhsgReturns] = useState<number[]>(
    () => initialScreenerCache?.liveIhsgReturns || REAL_IHSG_30D_RETURNS
  );
  const [regime, setRegime] = useState<MarketRegime>(() =>
    computeMarketRegime(
      initialScreenerCache?.liveIhsgReturns || REAL_IHSG_30D_RETURNS,
      18.0,
      initialScreenerCache?.macroIndicators || DEFAULT_GLOBAL_MACRO,
      initialScreenerCache?.liveIhsgQuote || {
        lastPrice: 5034.43,
        change1D: 2.33
      }
    )
  );
  const [stocks, setStocks] = useState<StockMetrics[]>(
    () => initialScreenerCache?.stocks || buildIdx100StockUniverse(40)
  );
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(
    () => initialPortfolioCache?.holdings || DEFAULT_USER_PORTFOLIO_HOLDINGS
  );
  const [cashReserveIdr, setCashReserveIdr] = useState<number>(
    () => initialPortfolioCache?.cashReserveIdr ?? 15000000
  );
  const [lastCacheSavedAt, setLastCacheSavedAt] = useState<string>(
    () =>
      initialScreenerCache?.savedAt ||
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
  const [lastFullSyncDateTime, setLastFullSyncDateTime] = useState<string>(
    () => initialScreenerCache?.fullDateTimeStr || formatFullIndonesianDateTime(new Date())
  );

  // GitHub Repository JSON + PAT Cloud Sync State
  const [githubConfig, setGithubConfig] = useState<GitHubCloudConfig>(loadGitHubCloudConfig);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  const [newsItems, setNewsItems] = useState<NewsSentimentItem[]>(DEFAULT_NEWS_SENTIMENT);
  const [dataSourceLabel, setDataSourceLabel] = useState<string>(
    isGitHubCloudConfigured(loadGitHubCloudConfig())
      ? 'Cloud: GitHub Repo JSON'
      : 'Feed: Yahoo Finance Spark Batch'
  );
  const [isMasterSyncing, setIsMasterSyncing] = useState<boolean>(false);
  const [syncStatusLabel, setSyncStatusLabel] = useState<string | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);

  const liveSyncedStockCount = useMemo(
    () => stocks.filter((s) => s.isLiveFetched).length,
    [stocks]
  );

  const handleToggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    try {
      localStorage.setItem(THEME_CACHE_KEY, next);
    } catch {
      // ignore
    }
  };

  // Build current CloudStateBundle for GitHub Repo JSON persistence
  const buildCloudBundle = useCallback(
    (
      overrideHoldings?: PortfolioHolding[],
      overrideCash?: number,
      overrideStocks?: StockMetrics[],
      overrideBuffer?: number
    ): CloudStateBundle => ({
      schemaVersion: '3.0-DEMIGUEL-MF24',
      updatedAt: new Date().toISOString(),
      strategyName: 'Vol-Managed Multifactor + 40% Buffer',
      rebalanceBufferPct: overrideBuffer ?? rebalanceBufferPct,
      thresholdAnnVol,
      capitalIdr,
      cashReserveIdr: overrideCash ?? cashReserveIdr,
      holdings: overrideHoldings ?? holdings,
      stocks: overrideStocks ?? stocks,
      macroIndicators,
      liveIhsgQuote,
      liveIhsgReturns
    }),
    [
      rebalanceBufferPct,
      thresholdAnnVol,
      capitalIdr,
      cashReserveIdr,
      holdings,
      stocks,
      macroIndicators,
      liveIhsgQuote,
      liveIhsgReturns
    ]
  );

  // Pull state from GitHub Repository JSON
  const handlePullFromGitHub = useCallback(
    async (customCfg?: GitHubCloudConfig, silent: boolean = false) => {
      const cfg = customCfg ?? githubConfig;
      if (!isGitHubCloudConfigured(cfg)) {
        if (!silent) {
          setIsCloudModalOpen(true);
        }
        return;
      }

      setIsSyncingCloud(true);
      try {
        const { bundle, sha } = await pullStateFromGitHubRepo(cfg);
        if (Array.isArray(bundle.stocks) && bundle.stocks.length > 0) {
          setStocks(rankUniverseWithBuffer(bundle.stocks, bundle.rebalanceBufferPct ?? 40));
        }
        if (Array.isArray(bundle.holdings)) {
          setHoldings(bundle.holdings);
        }
        if (typeof bundle.cashReserveIdr === 'number') {
          setCashReserveIdr(bundle.cashReserveIdr);
        }
        if (typeof bundle.rebalanceBufferPct === 'number') {
          setRebalanceBufferPct(bundle.rebalanceBufferPct);
        }
        if (typeof bundle.capitalIdr === 'number') {
          setCapitalIdr(bundle.capitalIdr);
        }
        if (bundle.liveIhsgQuote?.lastPrice) {
          setLiveIhsgQuote(bundle.liveIhsgQuote);
        }

        const nowTime = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const updatedCfg: GitHubCloudConfig = {
          ...cfg,
          lastSyncedSha: sha,
          lastSyncedAt: nowTime
        };
        setGithubConfig(updatedCfg);
        saveGitHubCloudConfig(updatedCfg);
        setLastCacheSavedAt(`${nowTime} (GitHub Cloud)`);
        setDataSourceLabel(`GitHub Cloud: ${cfg.owner}/${cfg.repo}`);

        if (!silent) {
          Swal.fire({
            icon: 'success',
            title: 'Data Diunduh dari GitHub Repo JSON',
            text: `Portofolio (${bundle.holdings?.length ?? 0} posisi) & Screener (${bundle.stocks?.length ?? 0} saham) berhasil disinkronkan dari ${cfg.owner}/${cfg.repo}.`,
            confirmButtonColor: '#D97706'
          });
        }
      } catch (err: unknown) {
        if (!silent) {
          const msg = err instanceof Error ? err.message : 'Gagal menarik data dari GitHub.';
          Swal.fire({
            icon: 'warning',
            title: 'GitHub Pull Info',
            text: msg,
            confirmButtonColor: '#D97706'
          });
        }
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [githubConfig]
  );

  // Push (commit) state to GitHub Repository JSON
  const handlePushToGitHub = useCallback(
    async (
      customCfg?: GitHubCloudConfig,
      customBundle?: CloudStateBundle,
      silent: boolean = false
    ) => {
      const cfg = customCfg ?? githubConfig;
      if (!isGitHubCloudConfigured(cfg)) {
        if (!silent) {
          setIsCloudModalOpen(true);
        }
        return;
      }

      setIsSyncingCloud(true);
      try {
        const bundleToPush = customBundle ?? buildCloudBundle();
        const { sha, syncedAt } = await pushStateToGitHubRepo(cfg, bundleToPush);
        const updatedCfg: GitHubCloudConfig = {
          ...cfg,
          lastSyncedSha: sha,
          lastSyncedAt: syncedAt
        };
        setGithubConfig(updatedCfg);
        saveGitHubCloudConfig(updatedCfg);
        setLastCacheSavedAt(`${syncedAt} (GitHub Cloud)`);
        setDataSourceLabel(`GitHub Cloud: ${cfg.owner}/${cfg.repo}`);

        if (!silent) {
          Swal.fire({
            icon: 'success',
            title: 'Tersimpan di GitHub Repository JSON',
            text: `State portofolio & screener berhasil di-commit ke ${cfg.owner}/${cfg.repo}/${cfg.filePath}. Kini dapat diakses real-time dari perangkat mana pun.`,
            confirmButtonColor: '#D97706'
          });
        }
      } catch (err: unknown) {
        if (!silent) {
          const msg = err instanceof Error ? err.message : 'Gagal melakukan commit ke GitHub.';
          Swal.fire({
            icon: 'error',
            title: 'GitHub Push Error',
            text: msg,
            confirmButtonColor: '#D97706'
          });
        }
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [githubConfig, buildCloudBundle]
  );

  // Keep instant local fallback synced
  useEffect(() => {
    if (isCalmSim) return;
    try {
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const payload: ScreenerCachePayload = {
        savedAt: nowStr,
        fullDateTimeStr: lastFullSyncDateTime,
        stocks,
        macroIndicators,
        liveIhsgQuote,
        liveIhsgReturns
      };
      localStorage.setItem(SCREENER_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [stocks, macroIndicators, liveIhsgQuote, liveIhsgReturns, isCalmSim, lastFullSyncDateTime]);

  useEffect(() => {
    try {
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const payload: PortfolioCachePayload = {
        savedAt: nowStr,
        holdings,
        cashReserveIdr,
        rebalanceBufferPct,
        capitalIdr
      };
      localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [holdings, cashReserveIdr, rebalanceBufferPct, capitalIdr]);

  // Handlers that update portfolio/screener and auto-push to GitHub if enabled
  const handleUpdateHoldingsWithCloud = (nextHoldings: PortfolioHolding[]) => {
    setHoldings(nextHoldings);
    if (isGitHubCloudConfigured(githubConfig) && githubConfig.autoSyncOnEdit) {
      const bundle = buildCloudBundle(nextHoldings, undefined, undefined, undefined);
      handlePushToGitHub(githubConfig, bundle, true);
    }
  };

  const handleUpdateCashWithCloud = (nextCash: number) => {
    setCashReserveIdr(nextCash);
    if (isGitHubCloudConfigured(githubConfig) && githubConfig.autoSyncOnEdit) {
      const bundle = buildCloudBundle(undefined, nextCash, undefined, undefined);
      handlePushToGitHub(githubConfig, bundle, true);
    }
  };

  const handleUpdateRebalanceBuffer = (nextBuffer: number) => {
    setRebalanceBufferPct(nextBuffer);
    const reranked = rankUniverseWithBuffer(stocks, nextBuffer);
    setStocks(reranked);
    if (isGitHubCloudConfigured(githubConfig) && githubConfig.autoSyncOnEdit) {
      const bundle = buildCloudBundle(undefined, undefined, reranked, nextBuffer);
      handlePushToGitHub(githubConfig, bundle, true);
    }
  };

  // Toggle between current Real Market Sentiment and Simulated Calm Sentiment
  const handleToggleSimulatedRegime = () => {
    const nextCalmState = !isCalmSim;
    setIsCalmSim(nextCalmState);
    const nextMacro = nextCalmState ? CALM_GLOBAL_MACRO : DEFAULT_GLOBAL_MACRO;
    const nextRets = nextCalmState ? CALM_IHSG_30D_RETURNS : liveIhsgReturns;
    const nextQuote = nextCalmState
      ? { lastPrice: 5180.25, change1D: 0.85 }
      : liveIhsgQuote;

    setMacroIndicators(nextMacro);
    const nextRegime = computeMarketRegime(
      nextRets,
      thresholdAnnVol,
      nextMacro,
      nextQuote
    );
    setRegime(nextRegime);
    setDataSourceLabel(
      nextCalmState
        ? 'Mode: Simulasi Sentimen Tenang'
        : isGitHubCloudConfigured(githubConfig)
        ? `GitHub Cloud: ${githubConfig.owner}/${githubConfig.repo}`
        : 'Feed: Yahoo Finance Spark Batch'
    );
  };

  const handleUpdateThreshold = (newThreshold: number) => {
    setThresholdAnnVol(newThreshold);
    const nextRegime = computeMarketRegime(
      isCalmSim ? CALM_IHSG_30D_RETURNS : liveIhsgReturns,
      newThreshold,
      macroIndicators,
      isCalmSim ? { lastPrice: 5180.25, change1D: 0.85 } : liveIhsgQuote
    );
    setRegime(nextRegime);
  };

  /**
   * Unified Single Master Sync Button Handler
   * Simultaneously updates IHSG (^JKSE), All Stocks (19 or 100+ stocks), Global Macro Wire, and Live News RSS.
   */
  const handleMasterSyncAll = async (
    silent: boolean = false,
    overrideStockList?: StockMetrics[]
  ) => {
    const targetStocks = overrideStockList ?? stocks;
    setIsMasterSyncing(true);
    setIsLoadingNews(true);
    setSyncStatusLabel(`Menyinkronkan 0/${targetStocks.length} Saham...`);

    try {
      const [marketResult, liveNews] = await Promise.all([
        refreshLiveGlobalMacroAndIhsg(
          macroIndicators,
          targetStocks,
          (syncedCount, totalCount, tickerLabel) => {
            setSyncStatusLabel(
              `Syncing ${syncedCount}/${totalCount} (${tickerLabel})...`
            );
          }
        ),
        fetchLiveFinancialNewsRss(DEFAULT_NEWS_SENTIMENT)
      ]);

      const {
        updatedMacro,
        ihsgReturns30D,
        liveIhsgQuote: fetchedQuote,
        updatedStocks,
        fullTimestampStr
      } = marketResult;

      const rerankedStocks = rankUniverseWithBuffer(updatedStocks, rebalanceBufferPct);
      setMacroIndicators(updatedMacro);
      setStocks(rerankedStocks);
      setNewsItems(liveNews);

      const activeQuote = fetchedQuote || liveIhsgQuote;
      const activeRets = ihsgReturns30D || liveIhsgReturns;
      setLiveIhsgQuote(activeQuote);
      setLiveIhsgReturns(activeRets);
      setIsCalmSim(false);

      const nextRegime = computeMarketRegime(
        activeRets,
        thresholdAnnVol,
        updatedMacro,
        activeQuote
      );
      setRegime(nextRegime);

      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setLastCacheSavedAt(`${nowStr} WIB`);
      setLastFullSyncDateTime(fullTimestampStr);

      if (!silent) {
        const liveCount = rerankedStocks.filter((s) => s.isLiveFetched).length;
        Swal.fire({
          icon: 'success',
          title: `✓ ${liveCount}/${rerankedStocks.length} Saham & Makro Berhasil Sync Live`,
          html: `
            <div style="text-align:left;font-size:12.5px;line-height:1.6;color:#374151;">
              <div><strong>Waktu Update Sistem:</strong> ${fullTimestampStr}</div>
              <div><strong>IHSG (^JKSE):</strong> ${activeQuote.lastPrice.toLocaleString('id-ID', {
                minimumFractionDigits: 2
              })} (${activeQuote.change1D >= 0 ? '+' : ''}${activeQuote.change1D.toFixed(2)}%)</div>
              <div><strong>Emiten Tersinkron:</strong> ✓ ${liveCount} dari ${rerankedStocks.length} saham BEI (.JK) + 9 Indikator Makro + Berita RSS Live</div>
            </div>
          `,
          confirmButtonColor: '#D97706'
        });
      }
    } finally {
      setIsMasterSyncing(false);
      setIsLoadingNews(false);
      setSyncStatusLabel(null);
    }
  };

  // Load 100 Liquid BEI Stocks (IDX100) and immediately run high-speed batch sync
  const handleLoadIdx100Universe = () => {
    const idx100 = buildIdx100StockUniverse(rebalanceBufferPct);
    setStocks(idx100);
    handleMasterSyncAll(false, idx100);
  };

  // On initial mount: pull from GitHub Repo if configured, and run Master Sync silently
  useEffect(() => {
    const cfg = loadGitHubCloudConfig();
    if (isGitHubCloudConfigured(cfg)) {
      handlePullFromGitHub(cfg, true);
    }
    handleMasterSyncAll(true);
  }, []);

  const handleAddStock = (newStock: StockMetrics) => {
    setStocks((prev) => {
      const filtered = prev.filter((s) => s.ticker !== newStock.ticker);
      const next = rankUniverseWithBuffer([newStock, ...filtered], rebalanceBufferPct);
      if (isGitHubCloudConfigured(githubConfig) && githubConfig.autoSyncOnEdit) {
        const bundle = buildCloudBundle(undefined, undefined, next, undefined);
        handlePushToGitHub(githubConfig, bundle, true);
      }
      return next;
    });
  };

  const handleRemoveStock = (ticker: string) => {
    setStocks((prev) => {
      const next = rankUniverseWithBuffer(
        prev.filter((s) => s.ticker !== ticker),
        rebalanceBufferPct
      );
      if (isGitHubCloudConfigured(githubConfig) && githubConfig.autoSyncOnEdit) {
        const bundle = buildCloudBundle(undefined, undefined, next, undefined);
        handlePushToGitHub(githubConfig, bundle, true);
      }
      return next;
    });
  };

  const handleResetUniverse = () => {
    const defaultList = buildIdx100StockUniverse(rebalanceBufferPct);
    setStocks(defaultList);
    handleMasterSyncAll(true, defaultList);
  };

  const handleExportBackupJson = () => {
    const bundle = buildCloudBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nostradamus_cloud_state_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackupJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const nextStocks = parsed.stocks || parsed.screenerCache?.stocks;
        const nextHoldings = parsed.holdings || parsed.activePortfolio?.holdings;
        const nextCash =
          parsed.cashReserveIdr ?? parsed.activePortfolio?.cashReserveIdr;

        if (Array.isArray(nextStocks) && nextStocks.length > 0) {
          setStocks(rankUniverseWithBuffer(nextStocks, rebalanceBufferPct));
        }
        if (Array.isArray(nextHoldings)) {
          setHoldings(nextHoldings);
        }
        if (typeof nextCash === 'number') {
          setCashReserveIdr(nextCash);
        }
        Swal.fire({
          icon: 'success',
          title: 'File JSON Berhasil Dimuat',
          text: 'Data Screener & Portofolio berhasil dipulihkan.',
          confirmButtonColor: '#D97706'
        });
      } catch {
        Swal.fire({
          icon: 'error',
          title: 'Format JSON Tidak Valid',
          text: 'Pastikan file .JSON berasal dari Nostradamus Quant Terminal.',
          confirmButtonColor: '#D97706'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetCacheAndPortfolio = () => {
    localStorage.removeItem(SCREENER_CACHE_KEY);
    localStorage.removeItem(PORTFOLIO_CACHE_KEY);
    const defaultList = buildIdx100StockUniverse(40);
    setStocks(defaultList);
    setHoldings(DEFAULT_USER_PORTFOLIO_HOLDINGS);
    setCashReserveIdr(15000000);
    setRebalanceBufferPct(40);
    handleMasterSyncAll(true, defaultList);
    Swal.fire({
      icon: 'info',
      title: 'Portofolio & Screener Direset',
      text: 'Data dikembalikan ke konfigurasi awal + Buffer 40% dan disinkronkan ulang.',
      confirmButtonColor: '#D97706'
    });
  };

  // Strategy Execution Memo Modal
  const handleGenerateStrategyModal = (
    customCap?: number,
    picksPerSleeve: number = 4,
    selectionMode: 'LIVE_FACTOR_LEADER' | 'TOP_GAINERS_MOMENTUM' | 'SECTOR_ROTATION' = 'LIVE_FACTOR_LEADER'
  ) => {
    const activeCap = customCap ?? capitalIdr;
    const isVol = regime.status === 'VOLATIL';

    const analytics = computeOptimalHRPBarbellPortfolio(
      stocks,
      regime,
      activeCap,
      picksPerSleeve,
      selectionMode
    );
    const defPositions = analytics.positions.filter((p) => p.basket === 'DEFENSIVE');
    const aggPositions = analytics.positions.filter((p) => p.basket === 'AGGRESSIVE');

    const defRowsHtml = defPositions
      .map(
        (pos) => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E4E2DD;font-size:12px;font-variant-numeric:tabular-nums;">
          <span><strong style="color:#D97706;">${pos.stock.ticker}</strong> @ Rp ${pos.stock.lastPrice.toLocaleString('id-ID')} · Bobot ${pos.totalPortfolioWeightPct.toFixed(1)}% (<span style="color:${pos.stock.change1D >= 0 ? '#0D5C46' : '#9E2A2B'};font-weight:700;">1D ${pos.stock.change1D >= 0 ? '+' : ''}${pos.stock.change1D.toFixed(2)}%</span> · <span style="color:${pos.stock.return30D >= 0 ? '#0D5C46' : '#9E2A2B'};font-weight:700;">30D ${pos.stock.return30D >= 0 ? '+' : ''}${pos.stock.return30D.toFixed(1)}%</span>)</span>
          <span><strong>${pos.lots.toLocaleString('id-ID')} Lot</strong> · Rp ${pos.allocatedIdr.toLocaleString('id-ID')}</span>
        </div>`
      )
      .join('');

    const aggRowsHtml = aggPositions
      .map(
        (pos) => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E4E2DD;font-size:12px;font-variant-numeric:tabular-nums;">
          <span><strong style="color:#D97706;">${pos.stock.ticker}</strong> @ Rp ${pos.stock.lastPrice.toLocaleString('id-ID')} · Bobot ${pos.totalPortfolioWeightPct.toFixed(1)}% (<span style="color:${pos.stock.change1D >= 0 ? '#0D5C46' : '#9E2A2B'};font-weight:700;">1D ${pos.stock.change1D >= 0 ? '+' : ''}${pos.stock.change1D.toFixed(2)}%</span> · <span style="color:${pos.stock.return30D >= 0 ? '#0D5C46' : '#9E2A2B'};font-weight:700;">30D ${pos.stock.return30D >= 0 ? '+' : ''}${pos.stock.return30D.toFixed(1)}%</span>)</span>
          <span><strong>${pos.lots.toLocaleString('id-ID')} Lot</strong> · Rp ${pos.allocatedIdr.toLocaleString('id-ID')}</span>
        </div>`
      )
      .join('');

    Swal.fire({
      title: `Memo Eksekusi Portofolio Multifaktor + Buffer ${rebalanceBufferPct}%`,
      width: 650,
      html: `
        <div style="text-align:left;font-size:12.5px;line-height:1.5;color:#111315;">
          <div style="padding:12px;background:#FAF9F6;border:1px solid #E4E2DD;margin-bottom:12px;">
            <div style="font-size:10px;font-weight:700;color:#6b7280;">
              KEPUTUSAN ALOKASI BERBASIS SENTIMEN & SKALA VOLATILITAS (${lastFullSyncDateTime})
            </div>
            <div style="font-weight:700;font-size:14px;color:${isVol ? '#9E2A2B' : '#0D5C46'};margin-top:2px;">
              Sentimen ${regime.status} · IHSG ${regime.ihsgLastPrice.toLocaleString('id-ID')} · Vol 30D ${regime.annualizedVol30D.toFixed(2)}%
            </div>
            <div style="font-size:11.5px;color:#4b5563;margin-top:4px;">
              Skala Eksposur Ekuitas: <strong>${analytics.equityExposureWeightPct}% Saham Multifaktor</strong> vs <strong>${analytics.cashReserveWeightPct}% Cadangan Kas (Rp ${analytics.cashReserveTargetIdr.toLocaleString('id-ID')})</strong>
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;color:#0D5C46;margin-bottom:4px;">
              1. Keranjang Low-Volatility & Value Core (55% dari Porsi Ekuitas)
            </div>
            ${defRowsHtml}
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;color:#0284C7;margin-bottom:4px;">
              2. Keranjang Momentum Live & Size Alpha (45% dari Porsi Ekuitas)
            </div>
            ${aggRowsHtml}
          </div>

          <div style="padding:8px 12px;background:#EFF6FF;border:1px solid #BAE6FD;font-size:11px;color:#0284C7;">
            <strong>Aturan Rebalancing Buffer ${rebalanceBufferPct}%:</strong> Jangan menjual saham yang sudah ada di portofolio Anda selama peringkat komposit 4-faktornya masih berada di Top ${rebalanceBufferPct}% untuk menghemat komisi broker BEI.
          </div>
        </div>
      `,
      confirmButtonText: 'Tutup Memo',
      confirmButtonColor: '#D97706'
    });
  };

  const cloudConfigured = isGitHubCloudConfigured(githubConfig);

  return (
    <div
      className={
        themeMode === 'dark'
          ? 'theme-dark min-h-screen flex flex-col bg-[#090C10] text-[#E5E7EB]'
          : 'theme-light min-h-screen flex flex-col bg-[#F4F5F7] text-[#111315]'
      }
    >
      {/* Unified Sticky Top Shell: Header Bar + Menu Bar + Running Text Global Macro Wire */}
      <div className="sticky top-0 z-40 w-full shadow-xs">
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setShowDeployKitModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCloudModal={() => setIsCloudModalOpen(true)}
          isCloudConfigured={cloudConfigured}
          lastFullSyncDateTime={lastFullSyncDateTime}
          syncedCount={liveSyncedStockCount}
          totalStockCount={stocks.length}
          isMasterSyncing={isMasterSyncing}
          syncStatusLabel={syncStatusLabel}
          onMasterSyncAll={() => handleMasterSyncAll(false)}
        />

        {/* Running Text Global Macro Ticker Tape (Zero Horizontal Scrollbar) */}
        <GlobalMacroPulse
          indicators={macroIndicators}
          macroStressScore={regime.macroStressScore}
        />
      </div>

      {/* Workspace Sub-Toolbar: Active Telemetry, Cloud Sync Status & Dual-Theme Switcher */}
      <div className="max-w-6xl w-full mx-auto px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="font-bold text-[#D97706] bb-amber">
            Sentimen Pasar: {regime.status}
          </span>
          <span>·</span>
          <span>Rebalancing Buffer {rebalanceBufferPct}%</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 text-[#0D5C46] font-bold">
            <RefreshCw className="w-3 h-3" />
            <span>
              {liveSyncedStockCount}/{stocks.length} Emiten JCI
            </span>
          </span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setIsCloudModalOpen(true)}
            className="inline-flex items-center gap-1 font-semibold text-[#0284C7] bb-cyan hover:underline cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>
              {cloudConfigured
                ? `GitHub Cloud: ${githubConfig.owner}/${githubConfig.repo}`
                : 'Setup GitHub Repo JSON Sync'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs hover:border-[#F59E0B] transition-colors cursor-pointer"
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="text-[#F59E0B]">Daylight Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="text-[#111315]">Dark Terminal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Container: Renders ONLY the Active Workspace Tab (Zero Vertical Stacking) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-5 space-y-6">
        {showDeployKitModal ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#FFFFFF] border border-[#E4E2DD] p-4 rounded-xs">
              <div>
                <div className="text-xs font-bold text-[#D97706] bb-amber">
                  Dokumentasi Arsitektur &amp; Otomasi GitHub Actions
                </div>
                <div className="text-xs text-neutral-500">
                  Panduan teknis cron job harian &amp; unduhan paket kode sumber.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeployKitModal(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#D97706] text-white rounded-xs cursor-pointer"
              >
                ← Kembali ke Terminal
              </button>
            </div>
            <ArchitectureVault
              activeTab={activeVaultTab}
              onSelectTab={setActiveVaultTab}
            />
          </div>
        ) : (
          <>
            {/* TAB 01: COMMAND & MULTIFACTOR ALLOCATOR */}
            {activeTab === 'command' && (
              <div className="space-y-6">
                <MarketRegimeBanner
                  regime={regime}
                  dataSourceLabel={dataSourceLabel}
                  rebalanceBufferPct={rebalanceBufferPct}
                  isIhsgSynced={liveSyncedStockCount > 0}
                  onUpdateRebalanceBuffer={handleUpdateRebalanceBuffer}
                  onToggleSimulatedRegime={handleToggleSimulatedRegime}
                  onUpdateThreshold={handleUpdateThreshold}
                  onOpenStrategyModal={() => handleGenerateStrategyModal()}
                />

                <BarbellAllocatorCard
                  regime={regime}
                  stocks={stocks}
                  capitalIdr={capitalIdr}
                  onChangeCapital={setCapitalIdr}
                  onLoadIdx100Universe={handleLoadIdx100Universe}
                  onTriggerSweetAlert={(cap, picks, mode) =>
                    handleGenerateStrategyModal(cap, picks, mode)
                  }
                />
              </div>
            )}

            {/* TAB 02: 4-FACTOR SCREENER (.JK) */}
            {activeTab === 'screener' && (
              <ScreeningTable
                stocks={stocks}
                rebalanceBufferPct={rebalanceBufferPct}
                onLoadIdx100Universe={handleLoadIdx100Universe}
                onAddStock={handleAddStock}
                onRemoveStock={handleRemoveStock}
                onResetUniverse={handleResetUniverse}
              />
            )}

            {/* TAB 03: ACTIVE PORTFOLIO & GITHUB CLOUD SYNC */}
            {activeTab === 'portfolio' && (
              <ActivePortfolioManager
                stocks={stocks}
                regime={regime}
                holdings={holdings}
                cashReserveIdr={cashReserveIdr}
                rebalanceBufferPct={rebalanceBufferPct}
                lastCacheSavedAt={lastCacheSavedAt}
                githubConfig={githubConfig}
                isSyncingCloud={isSyncingCloud}
                onOpenCloudConfigModal={() => setIsCloudModalOpen(true)}
                onPullFromGitHub={() => handlePullFromGitHub(githubConfig, false)}
                onPushToGitHub={() => handlePushToGitHub(githubConfig, undefined, false)}
                onUpdateHoldings={handleUpdateHoldingsWithCloud}
                onUpdateCashReserve={handleUpdateCashWithCloud}
                onExportBackupJson={handleExportBackupJson}
                onImportBackupJson={handleImportBackupJson}
                onResetCacheAndPortfolio={handleResetCacheAndPortfolio}
              />
            )}

            {/* TAB 04: WALK-FORWARD OUT-OF-SAMPLE AUDIT & COLAB PYTHON */}
            {activeTab === 'backtest' && <SkepticalBacktestLab />}

            {/* TAB 05: GLOBAL MACRO & NEWS WIRE */}
            {activeTab === 'macro' && (
              <MarketNewsSentiment
                news={newsItems}
                isLoadingNews={isLoadingNews}
              />
            )}
          </>
        )}
      </main>

      {/* GitHub Repository JSON + PAT Cloud Configuration Modal */}
      <GitHubCloudSyncModal
        isOpen={isCloudModalOpen}
        config={githubConfig}
        isSyncing={isSyncingCloud}
        onClose={() => setIsCloudModalOpen(false)}
        onSaveConfig={(nextCfg) => {
          setGithubConfig(nextCfg);
          saveGitHubCloudConfig(nextCfg);
        }}
        onPullNow={(draftCfg) => handlePullFromGitHub(draftCfg, false)}
        onPushNow={(draftCfg) => handlePushToGitHub(draftCfg, undefined, false)}
      />

      {/* Institutional Footer: Nostradamus Quant Terminal & Credit: Fayadh © 2026 */}
      <footer className="bg-[#FFFFFF] border-t border-[#E4E2DD] py-5 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#111315]">
              &copy; 2026 Nostradamus Quant Terminal
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowDeployKitModal(!showDeployKitModal)}
              className="text-[#0284C7] bb-cyan hover:underline cursor-pointer"
            >
              {showDeployKitModal ? 'Tutup Dokumentasi' : 'Dokumentasi & GitHub Actions'}
            </button>
          </div>
          <div className="font-bold text-[#D97706] bb-amber">
            &copy; 2026 · Credit: Fayadh
          </div>
        </div>
      </footer>
    </div>
  );
}
