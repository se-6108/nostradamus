import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const MACRO_SYMBOLS = [
  '^JKSE',
  'IDR=X',
  'DX-Y.NYB',
  '^TNX',
  '^VIX',
  '^GSPC',
  '^HSI',
  'GC=F',
  'BZ=F'
];

const IDX_100_TICKERS = [
  'BBCA', 'BMRI', 'BBRI', 'BBNI', 'BRIS', 'BNGA', 'NISP', 'BTPS', 'BDMN', 'BNLI',
  'BBTN', 'BJBR', 'BJTM', 'PNBN', 'ARTO', 'BBYB', 'BFIN', 'ADMF',
  'ADRO', 'ITMG', 'PTBA', 'PGAS', 'MEDC', 'AKRA', 'HRUM', 'INDY', 'BUMI', 'ELSA',
  'RAJA', 'TOBA', 'DEWA', 'DOID', 'MBMA',
  'AMMN', 'ANTM', 'INCO', 'MDKA', 'NCKL', 'SMGR', 'INTP', 'TPIA', 'BRPT', 'INKP',
  'TKIM', 'TINS', 'ESSA', 'AVIA',
  'ICBP', 'INDF', 'MYOR', 'CMRY', 'AMRT', 'CPIN', 'TAPG', 'UNVR', 'JPFA', 'GGRM',
  'HMSP', 'LSIP', 'AALI', 'SSMS',
  'KLBF', 'SIDO', 'MIKA', 'HEAL', 'SILO', 'TSPC', 'PRDA', 'SAME',
  'TLKM', 'ISAT', 'EXCL', 'JSMR', 'BREN', 'PGEO', 'TOWR', 'TBIG', 'MTEL', 'ADHI',
  'ASII', 'UNTR', 'ARNA', 'TOTL', 'MARK', 'HEXA',
  'ACES', 'MAPI', 'MAPA', 'ERAA', 'AUTO', 'DRMA',
  'CTRA', 'BSDE', 'PWON', 'SMRA', 'PANI',
  'GOTO', 'EMTK', 'BUKA', 'ASSA'
];

async function fetchJson(url, timeoutMs = 9000) {
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSingleChart(symbol, range = '3mo', hostIdx = 0) {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  for (let attempt = 0; attempt < 2; attempt++) {
    const host = hosts[(hostIdx + attempt) % hosts.length];
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=1d`;
    try {
      const data = await fetchJson(url, 7500);
      const result = data?.chart?.result?.[0];
      if (!result) continue;
      const rawCloses = result?.indicators?.quote?.[0]?.close || [];
      const closes = rawCloses.filter((c) => typeof c === 'number' && Number.isFinite(c) && c > 0);
      const lastPrice = result?.meta?.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : 0);
      if (!lastPrice || lastPrice <= 0) continue;
      const prevClose =
        closes.length >= 2
          ? closes[closes.length - 2]
          : result?.meta?.chartPreviousClose || result?.meta?.previousClose || lastPrice;
      const change1D = prevClose > 0 ? Number((((lastPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;
      return {
        symbol,
        lastPrice,
        change1D,
        closes: closes.length >= 2 ? closes : [prevClose, lastPrice],
        shortName: result?.meta?.longName || result?.meta?.shortName
      };
    } catch {
      // try next host
    }
  }
  return null;
}

async function fetchSparkChunk(chunk, range = '3mo', chunkIdx = 0) {
  const resultMap = {};
  const host = chunkIdx % 2 === 0 ? 'query1.finance.yahoo.com' : 'query2.finance.yahoo.com';
  const joined = chunk.map((s) => encodeURIComponent(s)).join(',');
  const sparkUrl = `https://${host}/v8/finance/spark?symbols=${joined}&range=${encodeURIComponent(range)}&interval=1d`;

  try {
    const sparkData = await fetchJson(sparkUrl, 9000);
    if (sparkData && typeof sparkData === 'object') {
      for (const sym of chunk) {
        const entry = sparkData[sym];
        const rawCloses = entry?.close || [];
        const closes = rawCloses.filter((c) => typeof c === 'number' && Number.isFinite(c) && c > 0);
        if (closes.length >= 2) {
          const lastPrice = closes[closes.length - 1];
          const prevClose = closes[closes.length - 2] || entry?.chartPreviousClose || lastPrice;
          const change1D = prevClose > 0 ? Number((((lastPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;
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
    // fallback below
  }

  const missing = chunk.filter((s) => !resultMap[s]);
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (sym, idx) => {
        const single = await fetchSingleChart(sym, range, chunkIdx + idx);
        if (single) resultMap[sym] = single;
      })
    );
  }
  return resultMap;
}

function decodeHtmlEntities(input) {
  if (!input) return '';
  const namedMap = {
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
  let text = String(input);
  for (let pass = 0; pass < 2; pass++) {
    text = text
      .replace(/&(nbsp|amp|quot|apos|lsquo|rsquo|ldquo|rdquo|mdash|ndash|hellip|lt|gt);/gi, (m) => namedMap[m.toLowerCase()] ?? m)
      .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
      })
      .replace(/&#(\d+);/g, (_m, dec) => {
        const code = parseInt(dec, 10);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
      });
  }
  return text;
}

function stripTags(raw) {
  const withoutCdata = String(raw || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(withoutCdata).replace(/\s+/g, ' ').trim();
}

function extractXmlTag(block, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  return match ? stripTags(match[1]) : '';
}

async function fetchRssXmlDirect(rssUrl, sourceLabel, region, limit = 4) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
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
        id: `${region.toLowerCase()}_snap_${Date.now()}_${idx}`,
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

async function main() {
  const allSymbols = [
    ...MACRO_SYMBOLS,
    ...IDX_100_TICKERS.map((t) => `${t}.JK`)
  ];

  const CHUNK_SIZE = 15;
  const chunks = [];
  for (let i = 0; i < allSymbols.length; i += CHUNK_SIZE) {
    chunks.push(allSymbols.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Fetching Yahoo Finance Spark series for ${allSymbols.length} symbols...`);
  const [chunkMaps, newsResults] = await Promise.all([
    Promise.all(chunks.map((c, idx) => fetchSparkChunk(c, '3mo', idx))),
    Promise.all([
      fetchRssXmlDirect('https://www.cnbcindonesia.com/market/rss', 'CNBC Indonesia Market', 'DOMESTIC', 4),
      fetchRssXmlDirect('https://www.antaranews.com/rss/ekonomi.xml', 'Antara Ekonomi Nasional', 'DOMESTIC', 3),
      fetchRssXmlDirect('https://feeds.content.dowjones.io/public/rss/mw_topstories', 'MarketWatch Global Wire', 'GLOBAL', 4),
      fetchRssXmlDirect('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', 'CNBC Global Finance', 'GLOBAL', 3)
    ])
  ]);

  const sparkData = {};
  for (const map of chunkMaps) {
    Object.assign(sparkData, map);
  }

  const newsItems = newsResults.flat();
  const payload = {
    generatedAt: new Date().toISOString(),
    symbolCount: Object.keys(sparkData).length,
    data: sparkData,
    newsItems
  };

  const publicOut = path.resolve(__dirname, '../public/static-market-snapshot.json');
  fs.writeFileSync(publicOut, JSON.stringify(payload));
  console.log(`Saved ${Object.keys(sparkData).length}/${allSymbols.length} symbols and ${newsItems.length} news items to ${publicOut}`);
}

main().catch((err) => {
  console.error('Snapshot generation warning:', err);
  process.exit(0);
});
