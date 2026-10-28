const cheerio = require('cheerio');

const SOURCE_URL = 'https://www.wallstreet-online.de/statistik/top-aktien-performance';
const PERIODS = {
  '1d': 'performance1d',
  '7d': 'performance7d',
  '30d': 'performance30d',
  '1y': 'performance365d'
};

function germanNumber(value) {
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace('%', '');
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parsePerformancePage(html) {
  const $ = cheerio.load(html);
  const periods = {};

  for (const [period, className] of Object.entries(PERIODS)) {
    const stocks = [];
    $(`.tabpane.${className} table.t-data tbody tr`).each((_, row) => {
      const cells = $(row).children('td');
      if (cells.length < 9) return; // The source also has mobile-only detail rows.

      const nameLink = cells.eq(2).find('a[href^="/aktien/"]').first();
      const rank = Number.parseInt(cells.eq(0).text().trim(), 10);
      const name = nameLink.text().trim();
      if (!name || !Number.isInteger(rank)) return;

      stocks.push({
        rank,
        name,
        url: new URL(nameLink.attr('href'), SOURCE_URL).href,
        isNew: cells.eq(1).text().includes('Neu!'),
        price: germanNumber(cells.eq(3).text()),
        performance1dPercent: germanNumber(cells.eq(4).text()),
        performance7dPercent: germanNumber(cells.eq(7).text()),
        performance30dPercent: germanNumber(cells.eq(6).text()),
        performance1yPercent: germanNumber(cells.eq(8).text())
      });
    });

    if (stocks.length === 0) {
      throw new Error(`Missing source table: ${period}`);
    }
    periods[period] = stocks;
  }

  return periods;
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(SOURCE_URL, {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MiMiInfo1/1.0)' }
    });
    if (!upstream.ok) throw new Error(`Source returned HTTP ${upstream.status}`);

    const periods = parsePerformancePage(await upstream.text());
    return res.status(200).json({
      source: SOURCE_URL,
      generatedAt: new Date().toISOString(),
      periods
    });
  } catch (error) {
    console.error('Unable to generate /info1 JSON:', error);
    return res.status(502).json({ error: 'Unable to load current stock performance data' });
  }
}

module.exports = handler;
module.exports.parsePerformancePage = parsePerformancePage;
