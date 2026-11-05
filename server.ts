import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface SparkSeriesItem {
  symbol: string;
  lastPrice: number;
  change1D: number;
  closes: number[];
  shortName?: string;
}

async function fetchYahooJsonDirect(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json,text/plain,*/*'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSingleChartDirect(
  symbol: string,
  range: string = '3mo',
  hostIdx: number = 0
): Promise<SparkSeriesItem | null> {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  for (let attempt = 0; attempt < 2; attempt++) {
    const host = hosts[(hostIdx + attempt) % hosts.length];
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=${encodeURIComponent(range)}&interval=1d`;
    try {
      const data = await fetchYahooJsonDirect(url, 7000);
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const rawCloses: Array<number | null> =
        result?.indicators?.quote?.[0]?.close || [];
      const closes = rawCloses.filter(
        (c): c is number => typeof c === 'number' && Number.isFinite(c) && c > 0
      );
      const lastPrice =
        result?.meta?.regularMarketPrice ||
        (closes.length > 0 ? closes[closes.length - 1] : 0);
      if (!lastPrice || lastPrice <= 0) continue;

      const prevClose =
        closes.length >= 2
          ? closes[closes.length - 2]
          : result?.meta?.chartPreviousClose ||
            result?.meta?.previousClose ||
            lastPrice;
      const change1D =
        prevClose > 0 ? Number((((lastPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;

      return {
        symbol,
        lastPrice,
        change1D,
        closes: closes.length >= 2 ? closes : [prevClose, lastPrice],
        shortName: result?.meta?.longName || result?.meta?.shortName
      };
    } catch {
      // try alternate host
    }
  }
  return null;
}

async function fetchSparkBatchChunk(
  symbolsChunk: string[],
  range: string = '3mo',
  chunkIdx: number = 0
): Promise<Record<string, SparkSeriesItem>> {
  const resultMap: Record<string, SparkSeriesItem> = {};
  if (symbolsChunk.length === 0) return resultMap;

  const host =
    chunkIdx % 2 === 0 ? 'query1.finance.yahoo.com' : 'query2.finance.yahoo.com';
  const joined = symbolsChunk.map((s) => encodeURIComponent(s)).join(',');
  const sparkUrl = `https://${host}/v8/finance/spark?symbols=${joined}&range=${encodeURIComponent(
    range
  )}&interval=1d`;

  try {
    const sparkData = await fetchYahooJsonDirect(sparkUrl, 8500);
    if (sparkData && typeof sparkData === 'object') {
      for (const sym of symbolsChunk) {
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
    // Fallback below will fetch any missing symbols via /v8/finance/chart
  }

  // Fallback for any symbol in the chunk not returned by spark
  const missingSymbols = symbolsChunk.filter((s) => !resultMap[s]);
  if (missingSymbols.length > 0) {
    await Promise.all(
      missingSymbols.map(async (sym, idx) => {
        const single = await fetchSingleChartDirect(sym, range, chunkIdx + idx);
        if (single) {
          resultMap[sym] = single;
        }
      })
    );
  }

  return resultMap;
}

function decodeHtmlEntitiesServer(input: string): string {
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
  // Pass twice in case of double-encoded entities (&amp;#x2018;)
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

function stripTags(raw: string): string {
  const withoutCdataAndTags = raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntitiesServer(withoutCdataAndTags)
    .replace(/\s+/g, ' ')
    .trim();
}

function extractXmlTag(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  return match ? stripTags(match[1]) : '';
}

async function fetchRssXmlDirect(
  rssUrl: string,
  sourceLabel: string,
  region: 'DOMESTIC' | 'GLOBAL',
  limit: number = 4
) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = await res.text();
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    return itemMatches.slice(0, limit).map((itemXml, idx) => {
      const title = extractXmlTag(itemXml, 'title') || 'Market Update';
      const link = extractXmlTag(itemXml, 'link') || 'https://www.idx.co.id';
      const pubDate = (extractXmlTag(itemXml, 'pubDate') || 'Hari ini · Live RSS').slice(0, 22);
      const desc = extractXmlTag(itemXml, 'description').slice(0, 175);
      return {
        id: `${region.toLowerCase()}_srv_${Date.now()}_${idx}`,
        title,
        source: sourceLabel,
        publishedAt: pubDate,
        url: link,
        region,
        summary: desc ? `${desc}...` : undefined
      };
    });
  } catch {
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // 1. High-Throughput Multi-Symbol Batch Spark Endpoint (Supports 100+ Symbols in Parallel Chunks of 15)
  app.get('/api/yahoo/spark', async (req, res) => {
    try {
      const rawSymbols = String(req.query.symbols || '').trim();
      const range = String(req.query.range || '3mo').trim();
      if (!rawSymbols) {
        res.status(400).json({ error: 'Missing symbols query parameter' });
        return;
      }

      const symbols = Array.from(
        new Set(
          rawSymbols
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );

      const CHUNK_SIZE = 15;
      const chunks: string[][] = [];
      for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
        chunks.push(symbols.slice(i, i + CHUNK_SIZE));
      }

      const chunkResults = await Promise.all(
        chunks.map((chunk, idx) => fetchSparkBatchChunk(chunk, range, idx))
      );

      const combined: Record<string, SparkSeriesItem> = {};
      for (const map of chunkResults) {
        Object.assign(combined, map);
      }

      res.json({
        syncedAt: new Date().toISOString(),
        requestedCount: symbols.length,
        syncedCount: Object.keys(combined).length,
        data: combined
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Spark batch error';
      res.status(500).json({ error: message });
    }
  });

  // 2. Single-Ticker Chart Endpoint
  app.get('/api/yahoo/chart', async (req, res) => {
    try {
      const symbol = String(req.query.symbol || '').trim();
      const range = String(req.query.range || '6mo').trim();
      if (!symbol) {
        res.status(400).json({ error: 'Missing symbol parameter' });
        return;
      }
      const item = await fetchSingleChartDirect(symbol, range, 0);
      if (!item) {
        res.status(404).json({ error: `Ticker ${symbol} not found` });
        return;
      }
      res.json(item);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chart fetch error';
      res.status(500).json({ error: message });
    }
  });

  // 3. Direct Domestic & Global Financial News RSS Aggregator
  app.get('/api/news/rss', async (_req, res) => {
    try {
      const [cnbcId, antaraId, mwGlobal, cnbcGlobal] = await Promise.all([
        fetchRssXmlDirect(
          'https://www.cnbcindonesia.com/market/rss',
          'CNBC Indonesia Market',
          'DOMESTIC',
          4
        ),
        fetchRssXmlDirect(
          'https://www.antaranews.com/rss/ekonomi.xml',
          'Antara Ekonomi Nasional',
          'DOMESTIC',
          3
        ),
        fetchRssXmlDirect(
          'https://feeds.content.dowjones.io/public/rss/mw_topstories',
          'MarketWatch Global Wire',
          'GLOBAL',
          4
        ),
        fetchRssXmlDirect(
          'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
          'CNBC Global Finance',
          'GLOBAL',
          3
        )
      ]);

      res.json({
        items: [...cnbcId, ...antaraId, ...mwGlobal, ...cnbcGlobal]
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'News RSS error';
      res.status(500).json({ error: message, items: [] });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nostradamus Quant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
