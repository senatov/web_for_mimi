import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const outputDirectory = join(process.cwd(), 'dist', 'web-for-mimi');
const sourcePath = join(outputDirectory, 'index.html');
const trendsDirectory = join(outputDirectory, 'trends');
const trendsPath = join(trendsDirectory, 'index.html');

let html = await readFile(sourcePath, 'utf8');

function replaceOnce(pattern, replacement, label) {
    if (!pattern.test(html)) {
        throw new Error(`Unable to render Trends metadata: ${label} was not found in the built index.`);
    }
    html = html.replace(pattern, replacement);
}

const title = 'MiMiTrends — Local-First Market Anomaly Scanner for US and European Stocks';
const description = 'Local-first Kotlin and JavaFX stock scanner with performance-led discovery, fresh anomaly ranking, repeating short-cycle detection, and explainable US and European market analysis.';
const keywords = 'MiMiTrends, market anomaly scanner, live stock leader discovery, stock performance scanner, most traded stocks, repeating price cycle detector, unusual price movement, momentum scanner, US stock scanner, European stock scanner, Kotlin desktop app, JavaFX trading software, local-first market analysis, OHLCV scanner, volume anomaly, V-shaped reversal detector, SQLite market analytics';
const imageUrl = 'https://miminavi.tech/images/trends/MainWindow.png';
const pageUrl = 'https://miminavi.tech/trends';

replaceOnce(/<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title');
replaceOnce(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description');
replaceOnce(/<meta name="application-name" content="[^"]*">/, '<meta name="application-name" content="MiMiTrends">', 'application name');
replaceOnce(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${keywords}">`, 'keywords');
replaceOnce(/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="MiMiTrends">', 'mobile application title');
replaceOnce(/<meta property="og:site_name" content="[^"]*">/, '<meta property="og:site_name" content="MiMiTrends">', 'Open Graph site name');
replaceOnce(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, 'Open Graph title');
replaceOnce(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'Open Graph description');
replaceOnce(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`, 'Open Graph URL');
replaceOnce(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${imageUrl}">`, 'Open Graph image');
replaceOnce(/<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="MiMiTrends anomaly scanner and signal chart">', 'Open Graph image alt');
replaceOnce(/<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1696">', 'Open Graph image width');
replaceOnce(/<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="1263">', 'Open Graph image height');
replaceOnce(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`, 'Twitter title');
replaceOnce(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`, 'Twitter description');
replaceOnce(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${imageUrl}">`, 'Twitter image');
replaceOnce(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="MiMiTrends anomaly scanner and signal chart">', 'Twitter image alt');
replaceOnce(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`, 'canonical URL');
replaceOnce(/(<link rel="icon"[^>]*href=")[^"]*("[^>]*>)/, '$1/images/trends/AppIcon-1024.png$2', 'favicon');

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MiMiTrends',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'macOS',
    url: pageUrl,
    image: imageUrl,
    description,
    softwareRequirements: 'macOS desktop',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR'
    },
    author: {
        '@type': 'Person',
        name: 'Iakov Senatov',
        url: 'https://www.linkedin.com/in/iakov-senatov-07060765/'
    }
};

html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
const structuredDataTag = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
replaceOnce(/(<script src="\/analytics\.js" defer><\/script>)/, `${structuredDataTag}$1`, 'analytics script insertion point');

const staticFallback = `<div class="seo-static-fallback"><h1>MiMiTrends</h1><p>${description}</p><p>Discover current US and European market leaders, inspect fresh anomaly signals and repeating short cycles, and keep scanner history and imported transaction context locally in SQLite.</p><a href="https://github.com/senatov/mimiTrends/releases">Download MiMiTrends from GitHub</a></div>`;
html = html.replace(/<app-root>\s*<noscript>[\s\S]*?<\/noscript>/, '<app-root>');
replaceOnce(/<app-root>/, `<app-root>${staticFallback}`, 'application root');

await mkdir(trendsDirectory, {recursive: true});
await writeFile(trendsPath, html);
console.log(`Rendered route metadata: ${trendsPath}`);
