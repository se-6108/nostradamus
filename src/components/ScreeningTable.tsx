import React, { useState, useMemo } from 'react';
import { DeMiguelBufferZone, StockMetrics } from '../types/quant';
import { enrichStockMetrics, rankUniverseWithBuffer } from '../utils/quantEngine';
import { IDX_SECTOR_CATALOG, fetchLiveIdxTicker } from '../utils/liveMarketFetcher';
import { MetricTooltip } from './MetricTooltip';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Trash2,
  Globe,
  BookOpen,
  RefreshCw,
  Layers
} from 'lucide-react';

interface ScreeningTableProps {
  stocks: StockMetrics[];
  rebalanceBufferPct?: number;
  onLoadIdx100Universe?: () => void;
  onAddStock: (newStock: StockMetrics) => void;
  onRemoveStock: (ticker: string) => void;
  onResetUniverse: () => void;
}

type SortField =
  | 'dmuCompositeScore'
  | 'dmuLowVolScore'
  | 'dmuMomScore'
  | 'dmuValueScore'
  | 'dmuSizeScore'
  | 'lastPrice'
  | 'volatilityAnn';

export function ScreeningTable({
  stocks,
  rebalanceBufferPct = 40,
  onLoadIdx100Universe,
  onAddStock,
  onRemoveStock,
  onResetUniverse
}: ScreeningTableProps) {
  const [sortField, setSortField] = useState<SortField>('dmuCompositeScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [zoneFilter, setZoneFilter] = useState<'ALL' | DeMiguelBufferZone>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showSectorCatalog, setShowSectorCatalog] = useState<boolean>(false);
  const [selectedCatalogSector, setSelectedCatalogSector] = useState<string>('ALL');

  const [liveTickerQuery, setLiveTickerQuery] = useState<string>('');
  const [isFetchingLiveTicker, setIsFetchingLiveTicker] = useState<boolean>(false);
  const [liveStatusMsg, setLiveStatusMsg] = useState<string | null>(null);

  const [tickerInput, setTickerInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [sectorInput, setSectorInput] = useState('Energy');
  const [priceInput, setPriceInput] = useState('24475');
  const [betaInput, setBetaInput] = useState('0.84');
  const [roeInput, setRoeInput] = useState('26.8');
  const [derInput, setDerInput] = useState('0.14');
  const [marginInput, setMarginInput] = useState('29.4');

  const rankedStocks = useMemo(
    () => rankUniverseWithBuffer(stocks, rebalanceBufferPct),
    [stocks, rebalanceBufferPct]
  );

  const liveFetchedCount = useMemo(
    () => rankedStocks.filter((s) => s.isLiveFetched).length,
    [rankedStocks]
  );

  const uniqueCatalogSectors = useMemo(() => {
    const set = new Set(IDX_SECTOR_CATALOG.map((c) => c.sector));
    return ['ALL', ...Array.from(set)];
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'volatilityAnn');
    }
  };

  const filteredAndSortedStocks = useMemo(() => {
    return rankedStocks
      .filter((s) => {
        if (zoneFilter !== 'ALL' && s.dmuZone !== zoneFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          return (
            s.ticker.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return sortAsc ? diff : -diff;
      });
  }, [rankedStocks, sortField, sortAsc, zoneFilter, searchQuery]);

  const handleLiveFetchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTickerQuery.trim()) return;
    setIsFetchingLiveTicker(true);
    setLiveStatusMsg(null);
    try {
      const fetched = await fetchLiveIdxTicker(liveTickerQuery);
      onAddStock(fetched);
      setLiveTickerQuery('');
      setLiveStatusMsg(
        `${fetched.ticker}.JK berhasil dimuat (${
          fetched.isLiveFetched ? '✓ SYNCED Yahoo Finance' : 'Kalibrasi Katalog BEI'
        }) — Skor Multifaktor ${fetched.dmuCompositeScore.toFixed(2)}/10`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menarik ticker.';
      setLiveStatusMsg(msg);
    } finally {
      setIsFetchingLiveTicker(false);
    }
  };

  const handleAddFromCatalog = async (ticker: string) => {
    setIsFetchingLiveTicker(true);
    setLiveStatusMsg(null);
    try {
      const fetched = await fetchLiveIdxTicker(ticker);
      onAddStock(fetched);
      setLiveStatusMsg(
        `${fetched.ticker}.JK ditambahkan ke matriks Screener (Skor ${fetched.dmuCompositeScore.toFixed(2)})`
      );
    } catch {
      // handled inside fetchLiveIdxTicker
    } finally {
      setIsFetchingLiveTicker(false);
    }
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = tickerInput.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (!cleanTicker) return;

    const lastPrice = parseFloat(priceInput) || 1000;
    const beta1Y = parseFloat(betaInput) || 1.0;
    const roe = parseFloat(roeInput) || 15.0;
    const debtToEquity = parseFloat(derInput) || 0.5;
    const operatingMargin = parseFloat(marginInput) || 18.0;

    const newStock = enrichStockMetrics({
      ticker: cleanTicker,
      idxTicker: `IDX:${cleanTicker}`,
      yfTicker: `${cleanTicker}.JK`,
      name: nameInput.trim() || `${cleanTicker} Indonesia Tbk`,
      sector: sectorInput,
      lastPrice,
      change1D: 0.55,
      return30D: 2.4,
      beta1Y,
      volatilityAnn: Number((beta1Y * 18.5).toFixed(1)),
      roe,
      debtToEquity,
      operatingMargin,
      isLiveFetched: true,
      lastSyncedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    onAddStock(newStock);
    setTickerInput('');
    setNameInput('');
    setShowAddForm(false);
  };

  const formatZoneLabel = (zone: DeMiguelBufferZone, rankPct: number) => {
    switch (zone) {
      case 'TOP_DECILE_BUY':
        return {
          text: `Top Buy (${rankPct}%)`,
          color: 'text-[#0D5C46] font-bold'
        };
      case 'BUFFER_HOLD_40':
        return {
          text: `Hold ≤${rebalanceBufferPct}% (${rankPct}%)`,
          color: 'text-[#0284C7] bb-cyan font-bold'
        };
      default:
        return {
          text: `Rotate (${rankPct}%)`,
          color: 'text-[#9E2A2B] font-semibold'
        };
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-neutral-400 inline ml-0.5 shrink-0" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-[#D97706] bb-amber inline ml-0.5 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#D97706] bb-amber inline ml-0.5 shrink-0" />
    );
  };

  return (
    <section className="space-y-4">
      {/* Live .JK Ticker Lookup & 100-Stock BEI Universe Bar (Auto-Fit Full Width) */}
      <div className="p-4 sm:p-5 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#D97706] bb-amber block">
              Pencarian Ticker Saham BEI (.JK) · Yahoo Finance Multi-Symbol Spark Stream
            </span>
            <span className="text-[11px] text-neutral-500">
              Ketik kode emiten 4 huruf untuk menarik harga live atau muat langsung 100 saham likuid BEI (IDX100).
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onLoadIdx100Universe && (
              <button
                type="button"
                onClick={onLoadIdx100Universe}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0D5C46] bg-[#FAF9F6] border border-[#059669]/50 hover:border-[#059669] rounded-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Muat 100 Saham BEI (IDX100)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSectorCatalog(!showSectorCatalog)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bb-cyan bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#0284C7] rounded-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {showSectorCatalog
                  ? 'Tutup Katalog'
                  : `Katalog 100 Saham (${IDX_SECTOR_CATALOG.length})`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#F59E0B] rounded-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulasi Kustom</span>
            </button>
          </div>
        </div>

        {/* Full-Width Spacious Search Input Bar */}
        <form onSubmit={handleLiveFetchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            maxLength={8}
            value={liveTickerQuery}
            onChange={(e) => setLiveTickerQuery(e.target.value)}
            placeholder="Ketik kode saham BEI (contoh: ITMG, BBCA, MEDC, MYOR, CMRY, MIKA, UNTR, BREN)..."
            className="flex-1 min-w-0 px-3.5 py-2 text-xs font-bold uppercase bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          />
          <button
            type="submit"
            disabled={isFetchingLiveTicker}
            className="bb-btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#D97706] text-white text-xs font-bold rounded-xs hover:bg-[#B45309] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFetchingLiveTicker ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span>{isFetchingLiveTicker ? 'Menarik Data...' : 'Tarik Ticker (.JK)'}</span>
          </button>
        </form>

        {liveStatusMsg && (
          <div className="text-xs font-bold text-[#0D5C46] pt-0.5">
            {liveStatusMsg}
          </div>
        )}

        {/* Expandable 11-Sector 100-Stock IDX Catalog */}
        {showSectorCatalog && (
          <div className="pt-3.5 border-t border-[#E4E2DD] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#D97706] bb-amber">
                Direktori {IDX_SECTOR_CATALOG.length} Saham Likuid 11 Sektor BEI (Klik untuk menambahkan ke Screener):
              </span>
              <div className="flex flex-wrap gap-1">
                {uniqueCatalogSectors.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedCatalogSector(sec)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-xs border transition-colors cursor-pointer ${
                      selectedCatalogSector === sec
                        ? 'bg-[#D97706] text-white border-[#D97706] bb-btn-primary'
                        : 'bg-[#FAF9F6] text-neutral-700 border-[#E4E2DD] hover:border-[#F59E0B]'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-scroll-container grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
              {IDX_SECTOR_CATALOG.filter(
                (item) => selectedCatalogSector === 'ALL' || item.sector === selectedCatalogSector
              ).map((entry) => {
                const alreadyAdded = stocks.some((s) => s.ticker === entry.ticker);
                return (
                  <button
                    key={entry.ticker}
                    type="button"
                    disabled={isFetchingLiveTicker}
                    onClick={() => handleAddFromCatalog(entry.ticker)}
                    className={`p-2.5 text-left border rounded-xs transition-colors cursor-pointer ${
                      alreadyAdded
                        ? 'bg-[#FAF9F6] border-[#059669]'
                        : 'bg-[#FFFFFF] border-[#E4E2DD] hover:border-[#F59E0B]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#D97706] bb-amber">{entry.ticker}</span>
                      <span className="text-[10px] font-bold text-[#0284C7] bb-cyan">
                        {alreadyAdded ? 'Tersimpan' : '+ Tambah'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-600 truncate mt-0.5">
                      {entry.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 tabular-nums mt-0.5">
                      ROE {entry.defaultRoe}% · β {entry.approxBeta}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section Header & Buffer Zone Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0284C7] bb-cyan">
            <span>Screener Kuantitatif 4-Faktor BEI (.JK)</span>
            <span>·</span>
            <span className="text-[#0D5C46] font-bold">
              ✓ {liveFetchedCount}/{rankedStocks.length} Emiten Synced Live
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            Matriks Peringkat Multifaktor &amp; Zona Buffer {rebalanceBufferPct}%
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FFFFFF] rounded-xs border border-[#E4E2DD]">
            <button
              type="button"
              onClick={() => setZoneFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                zoneFilter === 'ALL'
                  ? 'bg-[#D97706] text-white bb-btn-primary'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Semua ({rankedStocks.length})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('TOP_DECILE_BUY')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                zoneFilter === 'TOP_DECILE_BUY'
                  ? 'bg-[#059669] text-white'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Top Buy ({rankedStocks.filter((s) => s.dmuZone === 'TOP_DECILE_BUY').length})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('BUFFER_HOLD_40')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                zoneFilter === 'BUFFER_HOLD_40'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Buffer ≤{rebalanceBufferPct}% ({rankedStocks.filter((s) => s.dmuZone === 'BUFFER_HOLD_40').length})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('ROTATE_OUT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                zoneFilter === 'ROTATE_OUT'
                  ? 'bg-[#E11D48] text-white'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Rotate Out ({rankedStocks.filter((s) => s.dmuZone === 'ROTATE_OUT').length})
            </button>
          </div>
        </div>
      </div>

      {/* Search & Reset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode saham atau sektor..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span>Bobot Faktor: 28% Low-Vol · 34% Mom Live · 23% Value · 15% Size</span>
          <span>·</span>
          <button
            type="button"
            onClick={onResetUniverse}
            className="text-[#D97706] bb-amber font-bold hover:underline cursor-pointer"
          >
            Reset 19 Saham Inti LQ45
          </button>
        </div>
      </div>

      {/* Custom Simulation Parameter Form */}
      {showAddForm && (
        <form
          onSubmit={handleManualAddSubmit}
          className="p-4 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#D97706] bb-amber">
              Simulasi Input Fundamental &amp; Volatilitas Emiten
            </h3>
            <span className="text-[11px] text-neutral-500">
              Menghitung otomatis ke-4 skor faktor kuantitatif
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 tabular-nums">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">Ticker</label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="ITMG"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold uppercase bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">Nama Emiten</label>
              <input
                type="text"
                placeholder="Indo Tambangraya Megah Tbk"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">Last Px (IDR)</label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">1Y Beta</label>
              <input
                type="number"
                step="0.01"
                value={betaInput}
                onChange={(e) => setBetaInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">ROE (%)</label>
              <input
                type="number"
                step="0.1"
                value={roeInput}
                onChange={(e) => setRoeInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">DER (x)</label>
              <input
                type="number"
                step="0.01"
                value={derInput}
                onChange={(e) => setDerInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-1">Op Margin (%)</label>
              <input
                type="number"
                step="0.1"
                value={marginInput}
                onChange={(e) => setMarginInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-[#111315] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bb-btn-primary px-4 py-1.5 bg-[#D97706] text-white text-xs font-semibold rounded-xs hover:bg-[#B45309] cursor-pointer"
            >
              Tambahkan ke Screener
            </button>
          </div>
        </form>
      )}

      {/* Auto-Fit Sticky Table with Dedicated Internal Scrollbar */}
      <div className="border border-[#E4E2DD] rounded-xs bg-[#FFFFFF] overflow-hidden">
        <div className="table-scroll-container max-h-[560px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse tabular-nums">
            <thead className="sticky top-0 z-20 bg-[#FAF9F6] shadow-xs">
              <tr className="border-b border-[#E4E2DD] bg-[#FAF9F6] text-[11px] font-bold text-neutral-500 select-none">
                <th className="py-2.5 px-2.5 w-[72px]">Ticker</th>
                <th className="py-2.5 px-2.5">
                  <MetricTooltip
                    label="Emiten & Sektor (σ · β · ROE)"
                    title="Profil Risiko & Profitabilitas Emiten"
                    laymanExplanation="σ (Volatilitas) = guncangan harga tahunan; β (Beta) = kepekaan terhadap IHSG (< 1 lebih tenang, > 1 lebih agresif); ROE = tingkat keuntungan bersih perusahaan."
                    practicalGuide="Cari perusahaan dengan ROE > 15% dan σ yang sesuai profil risiko Anda."
                  />
                </th>
                <th
                  onClick={() => handleSort('lastPrice')}
                  className="py-2.5 px-2.5 text-right cursor-pointer hover:text-[#D97706]"
                >
                  Last Px &amp; Sync {renderSortIcon('lastPrice')}
                </th>
                <th
                  onClick={() => handleSort('dmuLowVolScore')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:text-[#D97706]"
                >
                  <MetricTooltip
                    label="Low-Vol"
                    title="Faktor Low-Volatility (Bobot 28%)"
                    laymanExplanation="Skor Ketenangan Harga (1–10): menilai seberapa stabil dan tahan banting saham ini saat IHSG sedang bergejolak."
                    practicalGuide="Skor ≥ 7,5 artinya saham sangat stabil (cocok untuk Keranjang 1)."
                    align="right"
                  />
                  {renderSortIcon('dmuLowVolScore')}
                </th>
                <th
                  onClick={() => handleSort('dmuMomScore')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:text-[#D97706]"
                >
                  <MetricTooltip
                    label="Mom Live"
                    title="Faktor Momentum Harga Live (Bobot 34%)"
                    laymanExplanation="Skor Tren Kenaikan (1–10): menilai seberapa kuat laju kenaikan harga saham dalam 1 hari & 30 hari terakhir dibanding guncangannya."
                    practicalGuide="Skor ≥ 7,0 menandakan saham sedang dalam tren naik (uptrend) yang kuat."
                    align="right"
                  />
                  {renderSortIcon('dmuMomScore')}
                </th>
                <th
                  onClick={() => handleSort('dmuValueScore')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:text-[#D97706]"
                >
                  <MetricTooltip
                    label="Value"
                    title="Faktor Value & Kewajaran Harga (Bobot 23%)"
                    laymanExplanation="Skor Fundamental & Diskon Harga (1–10): menilai seberapa tinggi laba perusahaan (ROE & Margin) dibandingkan harga sahamnya saat ini."
                    practicalGuide="Semakin tinggi skornya, semakin murah/bernilai saham tersebut dibanding kualitas bisnisnya."
                    align="right"
                  />
                  {renderSortIcon('dmuValueScore')}
                </th>
                <th
                  onClick={() => handleSort('dmuSizeScore')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:text-[#D97706]"
                >
                  <MetricTooltip
                    label="Size/Liq"
                    title="Faktor Kesehatan Neraca & Likuiditas (Bobot 15%)"
                    laymanExplanation="Menilai seberapa sehat rasio utang perusahaan (DER rendah) serta efisiensi perputaran modalnya (1–10)."
                    practicalGuide="Skor ≥ 7,0 berarti beban utang perusahaan sangat aman."
                    align="right"
                  />
                  {renderSortIcon('dmuSizeScore')}
                </th>
                <th
                  onClick={() => handleSort('dmuCompositeScore')}
                  className="py-2.5 px-2.5 text-right cursor-pointer hover:text-[#D97706] bg-[#FAF9F6]"
                >
                  <MetricTooltip
                    label="Skor Total"
                    title="Skor Rapor Total 4-Faktor (Skala 1–10)"
                    laymanExplanation="Nilai gabungan dari keempat faktor untuk mengurutkan saham terbaik di Bursa Efek Indonesia."
                    practicalGuide="≥ 7,2 = Sangat Unggul (Hijau); 5,5–7,1 = Menengah; < 5,2 = Hindari (Merah)."
                    align="right"
                  />
                  {renderSortIcon('dmuCompositeScore')}
                </th>
                <th className="py-2.5 px-2.5">
                  <MetricTooltip
                    label={`Buffer ${rebalanceBufferPct}%`}
                    title="Zona Rekomendasi Rebalancing Buffer"
                    laymanExplanation="Panduan tindakan praktis berdasarkan peringkat saham: 'Top Buy' = prioritas beli; 'Hold' = tetap simpan; 'Rotate' = kandidat jual/ganti."
                    align="right"
                  />
                </th>
                <th className="py-2.5 px-2 text-center w-10">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E2DD] text-xs">
              {filteredAndSortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-neutral-500 text-xs">
                    Tidak ada saham yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredAndSortedStocks.map((stock) => {
                  const zoneMeta = formatZoneLabel(stock.dmuZone, stock.dmuRankPct);
                  return (
                    <tr
                      key={stock.ticker}
                      className="hover:bg-[#FAF9F6] transition-colors"
                    >
                      <td className="py-2.5 px-2.5 font-bold text-[#D97706] bb-amber whitespace-nowrap">
                        {stock.ticker}
                        <span className="block text-[10px] font-semibold text-neutral-400">
                          {stock.yfTicker}
                        </span>
                      </td>

                      <td className="py-2.5 px-2.5 max-w-[230px]">
                        <div className="font-bold text-[#111315] text-xs truncate">
                          {stock.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate">
                          <span className="text-[#0284C7] bb-cyan font-semibold">{stock.sector}</span>
                          <span> · </span>
                          <span>σ {stock.volatilityAnn}%</span>
                          <span> · </span>
                          <span>β {stock.beta1Y.toFixed(2)}x</span>
                          <span> · </span>
                          <span>ROE {stock.roe.toFixed(1)}%</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[#111315] font-bold">
                            Rp {stock.lastPrice.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1 py-0.5 rounded-xs border ${
                              stock.isLiveFetched
                                ? 'text-[#0D5C46] border-[#059669]/40 bg-[#059669]/10'
                                : 'text-[#D97706] border-[#F59E0B]/40 bg-[#F59E0B]/10'
                            }`}
                          >
                            {stock.isLiveFetched ? '✓ SYNCED' : '⏳'}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] font-bold mt-0.5 ${
                            stock.change1D >= 0 ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
                          }`}
                        >
                          {stock.change1D >= 0 ? '+' : ''}
                          {stock.change1D.toFixed(2)}% (30D: {stock.return30D >= 0 ? '+' : ''}
                          {stock.return30D.toFixed(1)}%)
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-semibold text-[#111315]">
                        {stock.dmuLowVolScore.toFixed(1)}
                      </td>

                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-semibold text-[#111315]">
                        {stock.dmuMomScore.toFixed(1)}
                      </td>

                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-semibold text-[#111315]">
                        {stock.dmuValueScore.toFixed(1)}
                      </td>

                      <td className="py-2.5 px-2 text-right whitespace-nowrap font-semibold text-[#111315]">
                        {stock.dmuSizeScore.toFixed(1)}
                      </td>

                      <td className="py-2.5 px-2.5 text-right bg-[#FAF9F6] whitespace-nowrap">
                        <span
                          className={`text-sm font-bold ${
                            stock.dmuCompositeScore >= 7.2
                              ? 'text-[#0D5C46]'
                              : stock.dmuCompositeScore < 5.2
                              ? 'text-[#9E2A2B]'
                              : 'text-[#D97706] bb-amber'
                          }`}
                        >
                          {stock.dmuCompositeScore.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-400">/10</span>
                      </td>

                      <td className="py-2.5 px-2.5 text-[11px] whitespace-nowrap">
                        <span className={zoneMeta.color}>{zoneMeta.text}</span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveStock(stock.ticker)}
                          title={`Hapus ${stock.ticker}`}
                          className="text-neutral-400 hover:text-[#9E2A2B] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
