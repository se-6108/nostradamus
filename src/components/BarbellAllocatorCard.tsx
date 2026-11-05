import { useState, useMemo } from 'react';
import { MarketRegime, StockMetrics } from '../types/quant';
import {
  BasketSelectionMode,
  computeOptimalHRPBarbellPortfolio,
  computeSleeveSpecificScore,
  getBasketSelectionReason
} from '../utils/quantEngine';
import { MetricTooltip } from './MetricTooltip';
import { Calculator, SlidersHorizontal, Sparkles } from 'lucide-react';

interface BarbellAllocatorCardProps {
  regime: MarketRegime;
  stocks: StockMetrics[];
  capitalIdr: number;
  onChangeCapital: (capital: number) => void;
  onLoadIdx100Universe?: () => void;
  onTriggerSweetAlert: (
    capital: number,
    picksPerSleeve?: number,
    selectionMode?: BasketSelectionMode
  ) => void;
}

export function BarbellAllocatorCard({
  regime,
  stocks,
  capitalIdr,
  onChangeCapital,
  onLoadIdx100Universe,
  onTriggerSweetAlert
}: BarbellAllocatorCardProps) {
  const [rawInput, setRawInput] = useState(capitalIdr.toString());
  const [picksPerSleeve, setPicksPerSleeve] = useState<number>(4);
  const [selectionMode, setSelectionMode] =
    useState<BasketSelectionMode>('LIVE_FACTOR_LEADER');

  const analytics = useMemo(
    () =>
      computeOptimalHRPBarbellPortfolio(
        stocks,
        regime,
        capitalIdr,
        picksPerSleeve,
        selectionMode
      ),
    [stocks, regime, capitalIdr, picksPerSleeve, selectionMode]
  );

  const lowVolCorePositions = analytics.positions.filter((p) => p.basket === 'DEFENSIVE');
  const momentumValuePositions = analytics.positions.filter((p) => p.basket === 'AGGRESSIVE');

  const activeEquityPoolIdr = Math.round((capitalIdr * analytics.equityExposureWeightPct) / 100);
  const cashShieldPoolIdr = analytics.cashReserveTargetIdr;

  const liveFetchedCount = useMemo(
    () => stocks.filter((s) => s.isLiveFetched).length,
    [stocks]
  );

  const handleCapitalChange = (val: string) => {
    setRawInput(val);
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num >= 1000000) {
      onChangeCapital(num);
    }
  };

  return (
    <section className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs space-y-5">
      {/* Header & Capital Input */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E4E2DD] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-[#D97706] bb-amber">
              Alokasi Portofolio Dinamis Live · 40% No-Trade Rebalancing Buffer
            </span>
            <span className="text-neutral-400">·</span>
            <span
              className={
                liveFetchedCount === stocks.length
                  ? 'text-[#0D5C46] font-bold'
                  : 'text-[#D97706] bb-amber font-bold'
              }
            >
              ✓ {liveFetchedCount}/{stocks.length} Saham Synced Live
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315] mt-0.5">
            Kalkulator Alokasi Multifaktor &amp; Ukuran Lot BEI (1 Lot = 100 Lembar)
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Pemilihan saham Keranjang 1 &amp; Keranjang 2 dihitung secara dinamis dari harga &amp; momentum live Yahoo Finance (
            <span className="font-bold text-[#0284C7] bb-cyan">
              {analytics.equityExposureWeightPct}% Ekuitas Multifaktor : {analytics.cashReserveWeightPct}% Kas Pasar Uang
            </span>
            ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-1">
              Modal Portofolio (IDR)
            </label>
            <input
              type="text"
              value={Number(rawInput.replace(/[^0-9]/g, '') || 0).toLocaleString('id-ID')}
              onChange={(e) => handleCapitalChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold tabular-nums bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs w-44 text-right focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onTriggerSweetAlert(capitalIdr, picksPerSleeve, selectionMode)
            }
            className="bb-btn-primary self-end inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D97706] text-white text-xs font-semibold rounded-xs hover:bg-[#B45309] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Memo Eksekusi</span>
          </button>
        </div>
      </div>

      {/* Interactive Basket Selection Mode & Formula Transparency Bar */}
      <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#D97706] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#111315] block">
                Dasar Pengambilan &amp; Mode Seleksi Keranjang 1 vs Keranjang 2
              </span>
              <span className="text-[11px] text-neutral-500">
                Kedua keranjang menggunakan rumus perankingan berbeda yang langsung berubah mengikuti pergerakan harga live (1D &amp; 30D).
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selection Mode Buttons */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs">
              <button
                type="button"
                onClick={() => setSelectionMode('LIVE_FACTOR_LEADER')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-colors cursor-pointer ${
                  selectionMode === 'LIVE_FACTOR_LEADER'
                    ? 'bg-[#D97706] text-white bb-btn-primary'
                    : 'text-neutral-600 hover:text-[#111315]'
                }`}
              >
                Skor Faktor Live
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('TOP_GAINERS_MOMENTUM')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-colors cursor-pointer ${
                  selectionMode === 'TOP_GAINERS_MOMENTUM'
                    ? 'bg-[#059669] text-white'
                    : 'text-neutral-600 hover:text-[#111315]'
                }`}
              >
                Fokus Top Gainers Live
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('SECTOR_ROTATION')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-colors cursor-pointer ${
                  selectionMode === 'SECTOR_ROTATION'
                    ? 'bg-[#0284C7] text-white'
                    : 'text-neutral-600 hover:text-[#111315]'
                }`}
              >
                Lintas Sektor (1/Sektor)
              </button>
            </div>

            {/* Picks per Basket Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs">
              {[3, 4, 5, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setPicksPerSleeve(cnt)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-xs transition-colors cursor-pointer ${
                    picksPerSleeve === cnt
                      ? 'bg-[#111315] text-white'
                      : 'text-neutral-500 hover:text-[#111315]'
                  }`}
                >
                  {cnt} Saham
                </button>
              ))}
            </div>

            {stocks.length < 50 && onLoadIdx100Universe && (
              <button
                type="button"
                onClick={onLoadIdx100Universe}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-[#059669]/15 text-[#0D5C46] border border-[#059669]/40 rounded-xs hover:bg-[#059669]/25 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Perluas ke 100 Saham BEI</span>
              </button>
            )}
          </div>
        </div>

        {/* Formula Comparison Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-[#E4E2DD]/80 text-[11px]">
          <div className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs">
            <span className="font-bold text-[#0D5C46]">Rumus Keranjang 1 (Defensive Core): </span>
            <span className="text-neutral-600">
              Syarat <code className="font-bold">β ≤ 0.96</code> · Diurutkan dari{' '}
              <strong>50% Low-Vol Live + 30% Diskon Valuasi Harga Live + 20% Stabilitas Tren</strong>
              {selectionMode === 'SECTOR_ROTATION' ? ' (Maks 1 saham/sektor).' : ' (Maks 2 saham/sektor).'}
            </span>
          </div>
          <div className="px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs">
            <span className="font-bold text-[#0284C7] bb-cyan">Rumus Keranjang 2 (Momentum Alpha): </span>
            <span className="text-neutral-600">
              Kandidat Non-Keranjang 1 · Diurutkan dari{' '}
              <strong>60% Akselerasi Harga Live (Return 30D + Breakout 1D) + 25% Size + 15% Value</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio-Level Risk & Factor Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs tabular-nums">
        <div className="px-2">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Skor Komposit Multifaktor"
              title="Skor Komposit Multifaktor (Skala 1–10)"
              laymanExplanation="Nilai rapor rata-rata dari seluruh saham pilihan di Keranjang 1 & 2, dihitung dari ketenangan harga, tren kenaikan, murahnya harga dibanding laba, dan kesehatan utang."
              practicalGuide="Di atas 7,0 = Portofolio sangat berkualitas; di bawah 5,5 = Banyak saham yang sedang melemah."
            />
          </div>
          <span className="text-lg font-bold text-[#0D5C46] block mt-0.5">
            {analytics.portfolioQmj.toFixed(2)} / 10.0
          </span>
        </div>
        <div className="px-2 border-l border-[#E4E2DD]">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Eksposur Ekuitas vs Kas"
              title="Pembagian Modal Saham vs Kas"
              laymanExplanation="Perbandingan antara uang yang dibelikan saham aktif vs uang yang disimpan sebagai cadangan kas aman."
              practicalGuide="Misal 45% / 55% berarti dari Rp 100 Juta, Rp 45 Juta dibelikan saham dan Rp 55 Juta disimpan di kas/pasar uang."
            />
          </div>
          <span className="text-lg font-bold text-[#0284C7] bb-cyan block mt-0.5">
            {analytics.equityExposureWeightPct}% / {analytics.cashReserveWeightPct}%
          </span>
        </div>
        <div className="px-2 border-l border-[#E4E2DD]">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Estimasi OOS Net Sharpe"
              title="Out-of-Sample Net Sharpe Ratio"
              laymanExplanation="Ukuran seberapa sepadan potensi keuntungan yang didapat dibandingkan risiko guncangannya, setelah dikurangi biaya beli-jual sekuritas BEI."
              practicalGuide="Semakin tinggi semakin bagus. Angka ≥ 0,50 menandakan imbal hasil jauh lebih unggul dibanding sekadar menabung."
              align="right"
            />
          </div>
          <span className="text-lg font-bold text-[#D97706] bb-amber block mt-0.5">
            {analytics.sharpeEstimate.toFixed(2)} (Net Fee BEI)
          </span>
        </div>
        <div className="px-2 border-l border-[#E4E2DD]">
          <div className="text-[11px] font-semibold text-neutral-500">
            <MetricTooltip
              label="Cadangan Kas Vol-Scaling"
              title="Cadangan Kas Pelindung (Vol-Scaling)"
              laymanExplanation="Nominal uang tunai (Rupiah) yang wajib disisihkan saat ini agar nilai portofolio Anda tidak anjlok dalam ketika IHSG sedang bergejolak."
              practicalGuide="Dapat ditempatkan di RDN berbunga atau Reksa Dana Pasar Uang agar tetap menghasilkan bunga harian."
              align="right"
            />
          </div>
          <span className="text-lg font-bold text-[#0D5C46] block mt-0.5">
            Rp {(cashShieldPoolIdr / 1_000_000).toFixed(1)} Jt
          </span>
        </div>
      </div>

      {/* Two-Sided Multifactor Sleeves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 tabular-nums">
        {/* Left Sleeve: Low-Volatility & Value Factor Core */}
        <div className="p-4 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4E2DD] pb-2.5">
            <div>
              <div className="text-xs font-bold text-[#0D5C46]">
                <MetricTooltip
                  label={`Keranjang 1 · Low-Volatility & Value Core (${lowVolCorePositions.length} Saham)`}
                  title="Keranjang 1: Pelindung Nilai & Ketenangan (55% Porsi Saham)"
                  laymanExplanation="Berisi saham-saham berfundamental kuat yang gerak harganya relatif tenang (Beta ≤ 0,96) dan harganya masih wajar/diskon dibanding labanya."
                  practicalGuide="Berfungsi sebagai jangkar penahan agar portofolio Anda tidak mudah merah parah saat pasar goyang."
                  className="text-[#0D5C46]"
                />
              </div>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                Kriteria: β ≤ 0.96 · Volatilitas Rendah &amp; Valuasi Harga Live Menarik
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-[#0D5C46]">
                {Math.round(analytics.equityExposureWeightPct * 0.55)}% Porsi Modal
              </span>
              <span className="block text-xs font-semibold text-[#111315]">
                Rp {Math.round(activeEquityPoolIdr * 0.55).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#E4E2DD]/70 text-xs">
            {lowVolCorePositions.map((pos, idx) => {
              const isPos = pos.stock.change1D >= 0;
              const sleeveScore = computeSleeveSpecificScore(
                pos.stock,
                'DEFENSIVE',
                selectionMode
              );
              const reasonText = getBasketSelectionReason(
                pos.stock,
                'DEFENSIVE',
                selectionMode
              );

              return (
                <div
                  key={pos.stock.ticker}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-neutral-400">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#D97706] bb-amber">
                        {pos.stock.ticker}
                      </span>
                      <span className="font-bold text-[#111315]">
                        @ Rp {pos.stock.lastPrice.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          isPos ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
                        }`}
                      >
                        ({isPos ? '+' : ''}
                        {pos.stock.change1D.toFixed(2)}%)
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${
                          pos.stock.isLiveFetched
                            ? 'text-[#0D5C46] border-[#059669]/40 bg-[#059669]/10'
                            : 'text-[#D97706] border-[#F59E0B]/40 bg-[#F59E0B]/10'
                        }`}
                      >
                        {pos.stock.isLiveFetched ? '✓ SYNCED' : '⏳ PENDING'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {pos.stock.sector} · Bobot {pos.totalPortfolioWeightPct.toFixed(1)}% · Skor Defensif{' '}
                      <strong className="text-[#0D5C46]">{sleeveScore.toFixed(2)}</strong>
                    </div>
                    <div className="text-[10px] font-semibold text-[#0D5C46] mt-0.5">
                      Dasar: {reasonText}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#111315]">
                      {pos.lots.toLocaleString('id-ID')} Lot
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Rp {pos.allocatedIdr.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sleeve: Momentum (12-1) & Size Multifactor Sleeve */}
        <div className="p-4 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4E2DD] pb-2.5">
            <div>
              <div className="text-xs font-bold text-[#0284C7] bb-cyan">
                <MetricTooltip
                  label={`Keranjang 2 · Momentum Live & Size Alpha (${momentumValuePositions.length} Saham)`}
                  title="Keranjang 2: Akselerasi Momentum Live (45% Porsi Saham)"
                  laymanExplanation="Berisi saham-saham di luar Keranjang 1 yang sedang memiliki tarikan kenaikan harga terkuat dalam 1 hari & 30 hari terakhir (live dari Yahoo Finance)."
                  practicalGuide="Berfungsi sebagai mesin pendongkrak keuntungan (alpha) ketika tren pasar sedang mendukung."
                  align="right"
                  className="text-[#0284C7] bb-cyan"
                />
              </div>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                Kriteria: Akselerasi Return 30D + Breakout 1D &amp; Efisiensi Modal
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-[#0284C7] bb-cyan">
                {analytics.equityExposureWeightPct -
                  Math.round(analytics.equityExposureWeightPct * 0.55)}
                % Porsi Modal
              </span>
              <span className="block text-xs font-semibold text-[#111315]">
                Rp {Math.round(activeEquityPoolIdr * 0.45).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#E4E2DD]/70 text-xs">
            {momentumValuePositions.map((pos, idx) => {
              const isPos = pos.stock.change1D >= 0;
              const sleeveScore = computeSleeveSpecificScore(
                pos.stock,
                'AGGRESSIVE',
                selectionMode
              );
              const reasonText = getBasketSelectionReason(
                pos.stock,
                'AGGRESSIVE',
                selectionMode
              );

              return (
                <div
                  key={pos.stock.ticker}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-neutral-400">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#D97706] bb-amber">
                        {pos.stock.ticker}
                      </span>
                      <span className="font-bold text-[#111315]">
                        @ Rp {pos.stock.lastPrice.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          isPos ? 'text-[#0D5C46]' : 'text-[#9E2A2B]'
                        }`}
                      >
                        ({isPos ? '+' : ''}
                        {pos.stock.change1D.toFixed(2)}%)
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${
                          pos.stock.isLiveFetched
                            ? 'text-[#0D5C46] border-[#059669]/40 bg-[#059669]/10'
                            : 'text-[#D97706] border-[#F59E0B]/40 bg-[#F59E0B]/10'
                        }`}
                      >
                        {pos.stock.isLiveFetched ? '✓ SYNCED' : '⏳ PENDING'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {pos.stock.sector} · Bobot {pos.totalPortfolioWeightPct.toFixed(1)}% · Skor Momentum{' '}
                      <strong className="text-[#0284C7] bb-cyan">{sleeveScore.toFixed(2)}</strong>
                    </div>
                    <div className="text-[10px] font-semibold text-[#0284C7] bb-cyan mt-0.5">
                      Dasar: {reasonText}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#111315]">
                      {pos.lots.toLocaleString('id-ID')} Lot
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Rp {pos.allocatedIdr.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
