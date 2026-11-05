import React, { useState, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  MarketRegime,
  PortfolioHolding,
  RecommendationStrategyTag,
  StockMetrics,
  EvaluatedHolding,
  CandidateRecommendation,
  GitHubCloudConfig
} from '../types/quant';
import {
  evaluateActivePortfolio,
  generateCandidateRecommendations
} from '../utils/quantEngine';
import { isGitHubCloudConfigured } from '../utils/githubCloudSync';
import { MetricTooltip } from './MetricTooltip';
import { Cloud, UploadCloud, DownloadCloud, Settings } from 'lucide-react';

interface ActivePortfolioManagerProps {
  stocks: StockMetrics[];
  regime: MarketRegime;
  holdings: PortfolioHolding[];
  cashReserveIdr: number;
  rebalanceBufferPct: number;
  lastCacheSavedAt: string;
  githubConfig: GitHubCloudConfig;
  isSyncingCloud: boolean;
  onOpenCloudConfigModal: () => void;
  onPullFromGitHub: () => void;
  onPushToGitHub: () => void;
  onUpdateHoldings: (nextHoldings: PortfolioHolding[]) => void;
  onUpdateCashReserve: (nextCashIdr: number) => void;
  onExportBackupJson: () => void;
  onImportBackupJson: (file: File) => void;
  onResetCacheAndPortfolio: () => void;
}

export function ActivePortfolioManager({
  stocks,
  regime,
  holdings,
  cashReserveIdr,
  rebalanceBufferPct,
  lastCacheSavedAt,
  githubConfig,
  isSyncingCloud,
  onOpenCloudConfigModal,
  onPullFromGitHub,
  onPushToGitHub,
  onUpdateHoldings,
  onUpdateCashReserve,
  onExportBackupJson,
  onImportBackupJson,
  onResetCacheAndPortfolio
}: ActivePortfolioManagerProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('BBCA');
  const [customTickerInput, setCustomTickerInput] = useState<string>('');
  const [lotsInput, setLotsInput] = useState<string>('50');
  const [avgBuyInput, setAvgBuyInput] = useState<string>('4950');
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | RecommendationStrategyTag>('ALL');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cloudReady = isGitHubCloudConfigured(githubConfig);

  const evaluation = useMemo(
    () =>
      evaluateActivePortfolio(
        holdings,
        cashReserveIdr,
        stocks,
        regime,
        rebalanceBufferPct
      ),
    [holdings, cashReserveIdr, stocks, regime, rebalanceBufferPct]
  );

  const recommendations = useMemo(
    () =>
      generateCandidateRecommendations(
        holdings,
        stocks,
        regime,
        evaluation.totalPortfolioEquityIdr,
        strategyFilter
      ),
    [holdings, stocks, regime, evaluation.totalPortfolioEquityIdr, strategyFilter]
  );

  const handleSelectTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
    setCustomTickerInput('');
    const found = stocks.find((s) => s.ticker === ticker);
    if (found) {
      setAvgBuyInput(String(Math.round(found.lastPrice)));
    }
  };

  const handleSaveHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTicker = (customTickerInput.trim() || selectedTicker)
      .toUpperCase()
      .replace('.JK', '');
    const parsedLots = Math.max(1, Math.round(Number(lotsInput) || 0));
    const parsedAvgPrice = Math.max(50, Math.round(Number(avgBuyInput) || 0));

    if (!targetTicker) return;

    const existingIdx = holdings.findIndex(
      (h) => h.ticker.toUpperCase() === targetTicker
    );

    let nextHoldings: PortfolioHolding[];
    if (existingIdx >= 0) {
      nextHoldings = holdings.map((item, idx) =>
        idx === existingIdx
          ? {
              ...item,
              lots: parsedLots,
              avgBuyPrice: parsedAvgPrice,
              addedAt: new Date().toISOString().slice(0, 10)
            }
          : item
      );
    } else {
      nextHoldings = [
        ...holdings,
        {
          ticker: targetTicker,
          lots: parsedLots,
          avgBuyPrice: parsedAvgPrice,
          addedAt: new Date().toISOString().slice(0, 10),
          notes: 'Active Multifactor Position'
        }
      ];
    }

    onUpdateHoldings(nextHoldings);

    Swal.fire({
      icon: 'success',
      title:
        existingIdx >= 0
          ? `Posisi Diperbarui: ${targetTicker}`
          : `Posisi Ditambahkan: ${targetTicker}`,
      text: `${parsedLots.toLocaleString('id-ID')} Lot @ Rp ${parsedAvgPrice.toLocaleString('id-ID')} telah disimpan${
        cloudReady && githubConfig.autoSyncOnEdit
          ? ' dan disinkronkan ke GitHub Repo JSON.'
          : '.'
      }`,
      confirmButtonColor: '#D97706',
      timer: 2200
    });
  };

  const handleRemoveHolding = (ticker: string) => {
    const next = holdings.filter((h) => h.ticker.toUpperCase() !== ticker.toUpperCase());
    onUpdateHoldings(next);
  };

  const handleApplySingleRebalance = (item: EvaluatedHolding) => {
    const deltaLots = item.lotDeltaRecommendation;
    if (deltaLots === 0) return;

    const nextLots = Math.max(0, item.holding.lots + deltaLots);
    const tradeValueIdr = deltaLots * 100 * item.stock.lastPrice;
    const nextCash = Math.max(0, cashReserveIdr - tradeValueIdr);

    let nextHoldings: PortfolioHolding[];
    if (nextLots === 0) {
      nextHoldings = holdings.filter((h) => h.ticker !== item.holding.ticker);
    } else {
      nextHoldings = holdings.map((h) =>
        h.ticker === item.holding.ticker
          ? {
              ...h,
              lots: nextLots,
              avgBuyPrice:
                deltaLots > 0
                  ? Math.round(
                      (h.lots * h.avgBuyPrice + deltaLots * item.stock.lastPrice) /
                        nextLots
                    )
                  : h.avgBuyPrice
            }
          : h
      );
    }

    onUpdateHoldings(nextHoldings);
    onUpdateCashReserve(nextCash);

    Swal.fire({
      icon: 'success',
      title: `Rebalance Dieksekusi: ${item.holding.ticker}`,
      text:
        nextLots === 0
          ? `Posisi ${item.holding.ticker} (${item.holding.lots} Lot) dilikuidasi ke cadangan kas.`
          : `Posisi disesuaikan menjadi ${nextLots.toLocaleString('id-ID')} Lot (${
              deltaLots > 0 ? '+' : ''
            }${deltaLots} Lot) sesuai skala volatilitas pasar.`,
      confirmButtonColor: '#D97706'
    });
  };

  const handleInspectSignalModal = (item: EvaluatedHolding) => {
    const isPos = item.unrealizedPnlIdr >= 0;
    const deltaLots = item.lotDeltaRecommendation;
    Swal.fire({
      title: `Analisis Sinyal Portofolio · ${item.holding.ticker}.JK`,
      width: 580,
      html: `
        <div style="text-align:left;font-size:12.5px;line-height:1.5;color:#111315;">
          <div style="padding:12px;background:#FAF9F6;border:1px solid #E4E2DD;border-radius:2px;margin-bottom:12px;">
            <div style="font-size:10px;font-weight:700;color:#6b7280;">
              KEPUTUSAN REBALANCING BUFFER ${rebalanceBufferPct}%
            </div>
            <div style="font-size:14px;font-weight:700;margin-top:3px;color:${
              item.signal === 'ACCUMULATE' || item.signal === 'HOLD_CORE' || item.signal === 'BUFFER_HOLD'
                ? '#0D5C46'
                : '#9E2A2B'
            };">
              ${item.signalLabel} (${deltaLots > 0 ? '+' : ''}${deltaLots} Lot)
            </div>
            <div style="font-size:12px;color:#374151;margin-top:5px;">
              ${item.rationale}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-variant-numeric:tabular-nums;font-size:11.5px;">
            <div style="padding:8px 10px;border:1px solid #E4E2DD;">
              <span style="color:#6b7280;display:block;font-weight:700;">Kepemilikan & Harga Beli</span>
              <strong>${item.holding.lots} Lot @ Rp ${item.holding.avgBuyPrice.toLocaleString('id-ID')}</strong>
            </div>
            <div style="padding:8px 10px;border:1px solid #E4E2DD;">
              <span style="color:#6b7280;display:block;font-weight:700;">Harga Pasar Live & P&L</span>
              <strong>Rp ${item.stock.lastPrice.toLocaleString('id-ID')} (✓ SYNCED · ${isPos ? '+' : ''}${item.unrealizedPnlPct.toFixed(2)}%)</strong>
            </div>
            <div style="padding:8px 10px;border:1px solid #E4E2DD;">
              <span style="color:#6b7280;display:block;font-weight:700;">Bobot Aktual vs Target</span>
              <strong>${item.actualWeightPct.toFixed(1)}% vs ${item.targetOptimalWeightPct.toFixed(1)}%</strong>
            </div>
            <div style="padding:8px 10px;border:1px solid #E4E2DD;">
              <span style="color:#6b7280;display:block;font-weight:700;">Skor 4-Faktor & Peringkat</span>
              <strong>${item.stock.dmuCompositeScore.toFixed(2)}/10 · Rank Top ${item.stock.dmuRankPct}%</strong>
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#D97706'
    });
  };

  const handleAddRecommendationToPortfolio = (rec: CandidateRecommendation) => {
    const existing = holdings.find((h) => h.ticker === rec.stock.ticker);
    let nextHoldings: PortfolioHolding[];
    const estCostIdr = rec.suggestedLots * 100 * rec.stock.lastPrice;

    if (existing) {
      nextHoldings = holdings.map((h) =>
        h.ticker === rec.stock.ticker
          ? {
              ...h,
              lots: h.lots + rec.suggestedLots,
              avgBuyPrice: Math.round(
                (h.lots * h.avgBuyPrice + rec.suggestedLots * rec.stock.lastPrice) /
                  (h.lots + rec.suggestedLots)
              )
            }
          : h
      );
    } else {
      nextHoldings = [
        ...holdings,
        {
          ticker: rec.stock.ticker,
          lots: rec.suggestedLots,
          avgBuyPrice: Math.round(rec.stock.lastPrice),
          addedAt: new Date().toISOString().slice(0, 10),
          notes: rec.strategyLabel
        }
      ];
    }

    onUpdateHoldings(nextHoldings);

    Swal.fire({
      icon: 'success',
      title: `Ditambahkan ke Portofolio: ${rec.stock.ticker}`,
      html: `
        <div style="font-size:12.5px;color:#374151;line-height:1.5;">
          <strong>+${rec.suggestedLots.toLocaleString('id-ID')} Lot ${rec.stock.ticker}</strong> @ Rp ${rec.stock.lastPrice.toLocaleString('id-ID')} (Rp ${estCostIdr.toLocaleString('id-ID')}).<br/>
          <span style="font-size:11px;color:#0D5C46;font-weight:700;">Disimpan & siap diakses lintas perangkat via GitHub Cloud JSON</span>
        </div>
      `,
      confirmButtonColor: '#D97706'
    });
  };

  const isPnlPositive = evaluation.totalUnrealizedPnlIdr >= 0;

  return (
    <section
      id="active-portfolio-manager"
      className="bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs p-5 sm:p-6 space-y-6"
    >
      {/* GitHub Repo JSON + PAT Cloud Sync Command Bar */}
      <div className="p-4 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <Cloud className="w-4 h-4 text-[#D97706]" />
            <span className="text-[#D97706] bb-amber">
              GitHub Repository JSON Cloud Sync (Real-Time Cross-Device Access)
            </span>
            <span className="text-neutral-400">·</span>
            <span className={cloudReady ? 'text-[#0D5C46]' : 'text-neutral-500'}>
              {cloudReady
                ? `Terhubung: ${githubConfig.owner}/${githubConfig.repo} (${githubConfig.branch})`
                : 'Mode: Local Fallback (Hubungkan GitHub PAT agar realtime di semua perangkat)'}
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            Menyimpan portofolio &amp; screener langsung ke file{' '}
            <code className="font-bold">{githubConfig.filePath}</code> di repository GitHub Anda melalui REST API sehingga bisa dibuka dari laptop maupun HP secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPullFromGitHub}
            disabled={isSyncingCloud}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bb-cyan bg-[#FFFFFF] border border-[#E4E2DD] hover:border-[#0284C7] rounded-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>{isSyncingCloud ? 'Syncing...' : 'Pull dari GitHub'}</span>
          </button>

          <button
            type="button"
            onClick={onPushToGitHub}
            disabled={isSyncingCloud}
            className="bb-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isSyncingCloud ? 'Committing...' : 'Push ke GitHub Repo'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCloudConfigModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111315] bg-[#FFFFFF] border border-[#E4E2DD] hover:border-[#F59E0B] rounded-xs transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Konfigurasi Repo &amp; PAT</span>
          </button>
        </div>
      </div>

      {/* Top Header & Backup Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DD]">
        <div>
          <div className="text-xs font-semibold text-[#0D5C46]">
            Manajemen Portofolio Multifaktor · 40% No-Trade Rebalancing Buffer
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315] mt-0.5">
            Evaluasi Kepemilikan Saham, Sinyal Buffer 40% &amp; Radar Kandidat Baru
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Saham yang sudah dimiliki tidak dijual selama peringkat faktornya bertahan di{' '}
            <span className="font-bold text-[#0284C7] bb-cyan">Top {rebalanceBufferPct}%</span> demi menghemat biaya transaksi BEI (0,15% beli + 0,25% jual).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500 tabular-nums mr-1">
            Update: <strong className="text-[#D97706] bb-amber">{lastCacheSavedAt}</strong>
          </span>
          <button
            type="button"
            onClick={onExportBackupJson}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#0284C7] bb-cyan bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#0284C7] rounded-xs transition-colors cursor-pointer"
          >
            Export .JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#0284C7] bb-cyan bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#0284C7] rounded-xs transition-colors cursor-pointer"
          >
            Import .JSON
          </button>
          <button
            type="button"
            onClick={onResetCacheAndPortfolio}
            className="px-2 py-1.5 text-xs font-semibold text-[#9E2A2B] hover:underline transition-colors cursor-pointer"
          >
            Reset
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportBackupJson(file);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* 5-Column Active Portfolio Institutional KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Total Equity (NAV)"
              title="Total Kekayaan Portofolio (Net Asset Value)"
              laymanExplanation="Total nilai seluruh saham Anda (dihitung memakai harga pasar terbaru hari ini) ditambah uang tunai cadangan Anda."
            />
          </div>
          <div className="text-lg font-bold tabular-nums text-[#111315] mt-1">
            Rp {(evaluation.totalPortfolioEquityIdr / 1_000_000).toLocaleString('id-ID', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}{' '}
            Jt
          </div>
          <div className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
            Saham: Rp {evaluation.totalMarketValueIdr.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Unrealized P&L"
              title="Keuntungan / Kerugian Mengambang (Floating P&L)"
              laymanExplanation="Selisih antara nilai pasar saham Anda sekarang dibanding modal harga beli rata-rata Anda (belum dicairkan/dijual)."
            />
          </div>
          <div
            className={`text-lg font-bold tabular-nums mt-1 ${
              isPnlPositive ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
            }`}
          >
            {isPnlPositive ? '+' : ''}
            {evaluation.totalUnrealizedPnlPct.toFixed(2)}%
          </div>
          <div
            className={`text-[11px] font-bold tabular-nums mt-0.5 ${
              isPnlPositive ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
            }`}
          >
            {isPnlPositive ? '+Rp ' : '-Rp '}
            {Math.abs(evaluation.totalUnrealizedPnlIdr).toLocaleString('id-ID')}
          </div>
        </div>

        <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Skor Komposit Multifaktor"
              title="Rapor Kualitas Portofolio Anda (1–10)"
              laymanExplanation="Nilai rata-rata tertimbang dari kualitas 4-faktor saham yang sedang Anda pegang saat ini."
              practicalGuide="Usahakan tetap di atas 6,40 agar portofolio berisi saham-saham unggulan."
            />
          </div>
          <div className="text-lg font-bold tabular-nums text-[#0D5C46] mt-1">
            {evaluation.actualPortfolioQmj.toFixed(2)} / 10
          </div>
          <div className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
            Target Top {rebalanceBufferPct}%: &ge; 6.40
          </div>
        </div>

        <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Porsi Ekuitas vs Kas"
              title="Porsi Saham Aktual vs Cadangan Kas"
              laymanExplanation="Perbandingan nyata porsi saham dan uang tunai di portofolio Anda saat ini dibandingkan saran ideal sistem."
              align="right"
            />
          </div>
          <div className="text-lg font-bold tabular-nums text-[#0284C7] bb-cyan mt-1">
            {evaluation.actualAggressiveWeightPct.toFixed(0)}% / {evaluation.actualDefensiveWeightPct.toFixed(0)}%
          </div>
          <div className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
            Target Sentimen: {regime.aggressiveWeight}% / {regime.defensiveWeight}%
          </div>
        </div>

        <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Kesesuaian Sentimen Pasar"
              title="Skor Keselarasan dengan Cuaca Pasar (0–100)"
              laymanExplanation="Menilai apakah pembagian saham & kas Anda saat ini sudah cocok dengan kondisi IHSG (Tenang/Waspada/Volatil)."
              practicalGuide="≥ 75 = Sangat Selaras; < 60 = Perlu sesuaikan porsi kas/saham."
              align="right"
            />
          </div>
          <div
            className={`text-lg font-bold tabular-nums mt-1 ${
              evaluation.regimeAlignmentScore >= 75
                ? 'text-[#0D5C46]'
                : evaluation.regimeAlignmentScore >= 55
                ? 'text-[#D97706] bb-amber'
                : 'text-[#9E2A2B]'
            }`}
          >
            {evaluation.regimeAlignmentScore}/100
          </div>
          <div className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
            Portfolio Beta: {evaluation.actualPortfolioBeta.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Compact Rebalance Bar & Cash Reserve Input */}
      <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#111315]">
          <span className="font-bold text-[#D97706] bb-amber mr-2">
            Diagnosis Skala Volatilitas &amp; Sentimen Pasar:
          </span>
          Target Ekuitas <strong>{regime.aggressiveWeight}%</strong> &amp; Kas{' '}
          <strong>{regime.defensiveWeight}%</strong> vs Aktual:{' '}
          <strong className="text-[#0284C7] bb-cyan">
            {evaluation.actualAggressiveWeightPct.toFixed(1)}% Ekuitas /{' '}
            {evaluation.actualDefensiveWeightPct.toFixed(1)}% Kas
          </strong>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
            Cadangan Kas (IDR):
          </label>
          <input
            type="number"
            step={500000}
            min={0}
            value={cashReserveIdr}
            onChange={(e) => onUpdateCashReserve(Math.max(0, Number(e.target.value) || 0))}
            className="w-36 px-2.5 py-1 text-xs font-bold tabular-nums bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          />
        </div>
      </div>

      {/* Add / Edit Position Form */}
      <form
        onSubmit={handleSaveHolding}
        className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
            Pilih Saham Screener
          </label>
          <select
            value={selectedTicker}
            onChange={(e) => handleSelectTickerChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs font-bold bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          >
            {stocks.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — Rp {s.lastPrice.toLocaleString('id-ID')} (Skor {s.dmuCompositeScore.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
            Atau Ketik Ticker (.JK)
          </label>
          <input
            type="text"
            placeholder="Misal: ADRO, TLKM"
            value={customTickerInput}
            onChange={(e) => setCustomTickerInput(e.target.value.toUpperCase())}
            className="w-full px-2.5 py-1.5 text-xs font-bold uppercase bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
            Jumlah Lot (1 Lot = 100 Lbr)
          </label>
          <input
            type="number"
            min={1}
            max={1000000}
            value={lotsInput}
            onChange={(e) => setLotsInput(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs font-bold tabular-nums bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
            Harga Beli Rata-Rata (IDR)
          </label>
          <input
            type="number"
            min={50}
            step={5}
            value={avgBuyInput}
            onChange={(e) => setAvgBuyInput(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs font-bold tabular-nums bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        <div>
          <button
            type="submit"
            className="bb-btn-primary w-full px-3 py-1.5 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xs transition-colors cursor-pointer"
          >
            + Simpan Posisi
          </button>
        </div>
      </form>

      {/* Active Portfolio Evaluation Table (Sticky Header + Dedicated Scrollbar) */}
      <div className="border border-[#E4E2DD] rounded-xs bg-[#FFFFFF] overflow-hidden">
        <div className="table-scroll-container max-h-[440px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-[#FAF9F6] shadow-xs">
              <tr className="border-b border-[#E4E2DD] bg-[#FAF9F6] text-[11px] font-bold text-neutral-500">
                <th className="py-2.5 px-3">Ticker &amp; Skor 4-Faktor</th>
                <th className="py-2.5 px-3 text-right">Lot &amp; Avg Px</th>
                <th className="py-2.5 px-3 text-right">Last Px Live &amp; Nilai Pasar</th>
                <th className="py-2.5 px-3 text-right">Unrealized P&amp;L</th>
                <th className="py-2.5 px-3 text-right">
                  <MetricTooltip
                    label="Bobot Aktual vs Target"
                    title="Bobot Aktual vs Bobot Target Optimal"
                    laymanExplanation="Perbandingan antara persentase nilai saham ini di portofolio Anda sekarang dibanding persentase ideal menurut rumus kuantitatif."
                    practicalGuide="Jika selisih (Drift) masih di bawah 8%, Anda tidak perlu jual-beli agar hemat komisi broker."
                    align="right"
                  />
                </th>
                <th className="py-2.5 px-3">
                  <MetricTooltip
                    label={`Sinyal Buffer ${rebalanceBufferPct}%`}
                    title="Sinyal Keputusan Rebalancing Buffer"
                    laymanExplanation="Saran otomatis apakah posisi saham ini sebaiknya dipertahankan (HOLD), ditambah (ADD), dikurangi sebagian (TRIM), atau diganti (ROTATE OUT)."
                    align="right"
                  />
                </th>
                <th className="py-2.5 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E2DD] text-xs tabular-nums">
            {evaluation.holdings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-500">
                  Belum ada posisi saham aktif. Tambahkan saham di atas atau pilih dari radar rekomendasi di bawah.
                </td>
              </tr>
            ) : (
              evaluation.holdings.map((item) => {
                const isPos = item.unrealizedPnlIdr >= 0;
                const deltaLots = item.lotDeltaRecommendation;
                const signalColor =
                  item.signal === 'ACCUMULATE' || item.signal === 'HOLD_CORE'
                    ? 'text-[#0D5C46] font-bold'
                    : item.signal === 'BUFFER_HOLD'
                    ? 'text-[#0284C7] bb-cyan font-bold'
                    : item.signal === 'TRIM_REBALANCE'
                    ? 'text-[#D97706] bb-amber font-bold'
                    : 'text-[#9E2A2B] font-bold';

                return (
                  <tr
                    key={item.holding.ticker}
                    className="hover:bg-[#FAF9F6]/80 transition-colors"
                  >
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#D97706] bb-amber">
                        {item.holding.ticker}
                        <span className="text-[11px] font-semibold text-[#0284C7] bb-cyan ml-1.5">
                          · {item.stock.sector}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Skor <strong className="text-[#111315]">{item.stock.dmuCompositeScore.toFixed(2)}</strong> ·
                        Rank <strong className="text-[#111315]">Top {item.stock.dmuRankPct}%</strong> · σ{' '}
                        {item.stock.volatilityAnn.toFixed(1)}%
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="font-bold text-[#111315]">
                        {item.holding.lots.toLocaleString('id-ID')} Lot
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        @ Rp {item.holding.avgBuyPrice.toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-bold text-[#111315]">
                          Rp {item.stock.lastPrice.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${
                            item.stock.isLiveFetched
                              ? 'text-[#0D5C46] border-[#059669]/40 bg-[#059669]/10'
                              : 'text-[#D97706] border-[#F59E0B]/40 bg-[#F59E0B]/10'
                          }`}
                        >
                          {item.stock.isLiveFetched ? '✓ SYNCED' : '⏳ PENDING'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Rp {item.marketValueIdr.toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div
                        className={`font-bold ${
                          isPos ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
                        }`}
                      >
                        {isPos ? '+' : ''}
                        {item.unrealizedPnlPct.toFixed(2)}%
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          isPos ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
                        }`}
                      >
                        {isPos ? '+Rp ' : '-Rp '}
                        {Math.abs(item.unrealizedPnlIdr).toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="font-bold text-[#111315]">
                        {item.actualWeightPct.toFixed(1)}%
                        <span className="text-neutral-400 font-normal"> / </span>
                        <span className="text-[#0284C7] bb-cyan">
                          {item.targetOptimalWeightPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Drift: {item.weightDriftPct >= 0 ? '+' : ''}
                        {item.weightDriftPct.toFixed(1)}%
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className={`text-xs ${signalColor}`}>
                        {item.signalLabel}
                      </div>
                      <div className="text-[11px] text-neutral-600 line-clamp-1 max-w-xs mt-0.5">
                        {item.rationale}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1">
                      {deltaLots !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleApplySingleRebalance(item)}
                          className="bb-btn-primary px-2 py-1 text-[11px] font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xs transition-colors cursor-pointer"
                        >
                          Sesuaikan Lot
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleInspectSignalModal(item)}
                        className="px-2 py-1 text-[11px] font-semibold text-[#0284C7] bb-cyan bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#0284C7] rounded-xs transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHolding(item.holding.ticker)}
                        className="px-2 py-1 text-xs font-bold text-neutral-400 hover:text-[#9E2A2B] transition-colors cursor-pointer"
                        title="Hapus Posisi"
                      >
                        ×
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

      {/* Candidate Recommendation Radar */}
      <div className="pt-5 border-t border-[#E4E2DD] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#0284C7] bb-cyan">
              Radar Kandidat Top Multifaktor di Luar Portofolio Anda
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#111315]">
              Rekomendasi Emiten Top Multifaktor &amp; Estimasi Ukuran Lot
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Semua Kandidat' },
                { id: 'DEFENSIVE_SHIELD', label: 'Faktor Low-Vol' },
                { id: 'COMPOUNDER_QUALITY', label: 'Faktor Value' },
                { id: 'SECTOR_DIVERSIFIER', label: 'Lintas Sektor' },
                { id: 'ASYMMETRIC_ALPHA', label: 'Faktor Momentum' }
              ] as { id: 'ALL' | RecommendationStrategyTag; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStrategyFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                  strategyFilter === tab.id
                    ? 'bg-[#D97706] text-white bb-btn-primary'
                    : 'bg-[#FAF9F6] text-neutral-700 border border-[#E4E2DD] hover:border-[#F59E0B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs text-center text-xs text-neutral-500">
            Seluruh kandidat pada filter ini sudah berada di portofolio aktif Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
              const estIdr = rec.suggestedLots * 100 * rec.stock.lastPrice;

              return (
                <div
                  key={rec.stock.ticker}
                  className="bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs p-4 flex flex-col justify-between space-y-3 hover:border-[#F59E0B] transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#0284C7] bb-cyan">
                        {rec.strategyLabel}
                      </span>
                      <span className="tabular-nums text-[#D97706] bb-amber">
                        Skor: {rec.stock.dmuCompositeScore.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-bold text-[#D97706] bb-amber">
                          {rec.stock.ticker}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-500 ml-1.5">
                          · {rec.stock.sector}
                        </span>
                        <div className="text-xs font-medium text-[#111315] truncate max-w-[180px]">
                          {rec.stock.name}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-bold text-[#111315]">
                            Rp {rec.stock.lastPrice.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1 py-0.5 rounded-xs border ${
                              rec.stock.isLiveFetched
                                ? 'text-[#0D5C46] border-[#059669]/40 bg-[#059669]/10'
                                : 'text-[#D97706] border-[#F59E0B]/40 bg-[#F59E0B]/10'
                            }`}
                          >
                            {rec.stock.isLiveFetched ? '✓ SYNCED' : '⏳'}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] font-bold ${
                            rec.stock.change1D >= 0 ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
                          }`}
                        >
                          {rec.stock.change1D >= 0 ? '+' : ''}
                          {rec.stock.change1D.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5 px-2.5 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs flex items-center justify-between text-[11px] tabular-nums">
                      <span>
                        LowVol <strong className="text-[#0D5C46]">{rec.stock.dmuLowVolScore.toFixed(1)}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Mom <strong className="text-[#0284C7] bb-cyan">{rec.stock.dmuMomScore.toFixed(1)}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Val <strong>{rec.stock.dmuValueScore.toFixed(1)}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Top <strong>{rec.stock.dmuRankPct}%</strong>
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 leading-snug">
                      {rec.thesis}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#E4E2DD] space-y-2.5">
                    <div className="text-[11px] text-neutral-600 tabular-nums space-y-1">
                      <div className="flex justify-between">
                        <span>Profil Faktor:</span>
                        <span className="font-bold text-[#0284C7] bb-cyan">
                          {rec.betaImpact}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saran Alokasi ({rec.suggestedWeightPct}%):</span>
                        <span className="font-bold text-[#111315]">
                          {rec.suggestedLots.toLocaleString('id-ID')} Lot (Rp{' '}
                          {estIdr.toLocaleString('id-ID')})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddRecommendationToPortfolio(rec)}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xs transition-colors cursor-pointer"
                    >
                      + Masukkan ke Portofolio ({rec.suggestedLots} Lot)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
