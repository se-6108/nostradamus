import { useState, useMemo } from 'react';
import { NewsSentimentItem } from '../types/quant';
import { decodeHtmlEntities } from '../utils/liveMarketFetcher';
import { ExternalLink, Globe } from 'lucide-react';

interface MarketNewsSentimentProps {
  news: NewsSentimentItem[];
  isLoadingNews: boolean;
}

export function MarketNewsSentiment({
  news,
  isLoadingNews
}: MarketNewsSentimentProps) {
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'DOMESTIC' | 'GLOBAL'>('ALL');

  const filteredNews = useMemo(() => {
    if (regionFilter === 'ALL') return news;
    return news.filter((item) => (item.region || 'GLOBAL') === regionFilter);
  }, [news, regionFilter]);

  const domesticCount = useMemo(
    () => news.filter((item) => item.region === 'DOMESTIC').length,
    [news]
  );
  const globalCount = useMemo(
    () => news.filter((item) => (item.region || 'GLOBAL') === 'GLOBAL').length,
    [news]
  );

  const getSentimentLabel = (sentiment: NewsSentimentItem['sentiment']) => {
    switch (sentiment) {
      case 'RISK_ON':
        return { text: 'SENTIMEN POSITIF // BULLISH', color: 'text-[#0D5C46] font-bold' };
      case 'COMMODITY_BULL':
        return { text: 'KATALIS KOMODITAS', color: 'text-[#0284C7] bb-cyan font-bold' };
      case 'HAWKISH_RATES':
        return { text: 'WASPADA SUKU BUNGA / KURS', color: 'text-[#D97706] bb-amber font-bold' };
      case 'RISK_OFF':
        return { text: 'SENTIMEN DEFENSIF // RISK-OFF', color: 'text-[#9E2A2B] font-bold' };
    }
  };

  return (
    <section
      id="macro-news-desk"
      className="bg-[#FFFFFF] border border-[#E4E2DD] border-t-2 border-t-[#F59E0B] rounded-xs p-5 sm:p-6 space-y-5"
    >
      {/* Top Header & Region Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E4E2DD] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D97706] bb-amber">
            <Globe className="w-3.5 h-3.5" />
            <span>
              LIVE FINANCIAL NEWS WIRE // DALAM NEGERI &amp; LUAR NEGERI{' '}
              {isLoadingNews ? '(MENYINKRONKAN RSS...)' : '(✓ SYNCED)'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315] mt-0.5">
            Berita Pasar Saham Indonesia (IHSG) &amp; Makroekonomi Global
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Sinkronisasi berita keuangan langsung dari feed RSS dalam negeri (CNBC Indonesia, Antara Ekonomi) dan luar negeri (MarketWatch, CNBC Global) lengkap dengan tautan artikel asli.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Region Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs">
            <button
              type="button"
              onClick={() => setRegionFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                regionFilter === 'ALL'
                  ? 'bg-[#D97706] text-white bb-btn-primary'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Semua ({news.length})
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('DOMESTIC')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                regionFilter === 'DOMESTIC'
                  ? 'bg-[#059669] text-white'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Dalam Negeri ({domesticCount})
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('GLOBAL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                regionFilter === 'GLOBAL'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-neutral-600 hover:text-[#111315]'
              }`}
            >
              Luar Negeri ({globalCount})
            </button>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNews.map((item) => {
          const badge = getSentimentLabel(item.sentiment);
          const isDomestic = item.region === 'DOMESTIC';
          const cleanTitle = decodeHtmlEntities(item.title);
          const cleanSummary = item.summary ? decodeHtmlEntities(item.summary) : undefined;

          return (
            <article
              key={item.id}
              className={`p-4 bg-[#FAF9F6] border border-[#E4E2DD] border-l-2 ${
                isDomestic ? 'border-l-[#059669]' : 'border-l-[#0284C7]'
              } rounded-xs flex flex-col justify-between gap-3`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={
                        isDomestic
                          ? 'text-[#0D5C46]'
                          : 'text-[#0284C7] bb-cyan'
                      }
                    >
                      [{isDomestic ? 'DALAM NEGERI · RI' : 'LUAR NEGERI · GLOBAL'}]
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-[#D97706] bb-amber">{item.source}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-500">{item.publishedAt}</span>
                  </div>
                  <span className={badge.color}>{badge.text}</span>
                </div>

                <h3 className="text-sm font-bold text-[#111315] leading-snug">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#D97706] hover:underline transition-colors"
                  >
                    {cleanTitle}
                  </a>
                </h3>

                {cleanSummary && (
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {cleanSummary}
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-[#E4E2DD]/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="text-neutral-500">
                  <span className="font-bold">SEKTOR TERDAMPAK: </span>
                  <span className="font-bold text-[#0284C7] bb-cyan">
                    {item.impactedSectors.join(' · ')}
                  </span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#D97706] bb-amber hover:underline shrink-0"
                >
                  <span>Baca Berita Lengkap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
