import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const outputDirectory = join(process.cwd(), 'dist', 'web-for-mimi');
const sourcePath = join(outputDirectory, 'index.html');
const sitemapPath = join(outputDirectory, 'sitemap.xml');
const trendsDirectory = join(outputDirectory, 'trends');
const trendsPath = join(trendsDirectory, 'index.html');

const repositories = {
    navigator: 'senatov/MiMiNavigator',
    trends: 'senatov/mimiTrends'
};

function replaceOnce(source, pattern, replacement, label) {
    if (!pattern.test(source)) {
        throw new Error(`Unable to render metadata: ${label} was not found in the built index.`);
    }
    return source.replace(pattern, replacement);
}

async function loadLatestRelease(repository) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'web_for_mimi-build'
    };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {headers});
    if (!response.ok) {
        throw new Error(`GitHub returned ${response.status} for ${repository}`);
    }

    const release = await response.json();
    const publishedAt = release.published_at || release.created_at;
    if (!release.tag_name || !publishedAt) {
        throw new Error(`Latest release metadata is incomplete for ${repository}`);
    }

    return {
        version: release.tag_name.replace(/^v/, ''),
        datePublished: publishedAt.slice(0, 10),
        downloadUrl: release.html_url || `https://github.com/${repository}/releases`
    };
}

function updateNavigatorReleaseMetadata(html, release) {
    let updated = replaceOnce(html, /(\"softwareVersion\"\s*:\s*)\"[^\"]*\"/, `$1"${release.version}"`, 'MiMiNavigator softwareVersion');
    updated = replaceOnce(updated, /(\"datePublished\"\s*:\s*)\"[^\"]*\"/, `$1"${release.datePublished}"`, 'MiMiNavigator datePublished');
    return replaceOnce(updated, /(\"downloadUrl\"\s*:\s*)\"[^\"]*\"/, `$1"${release.downloadUrl}"`, 'MiMiNavigator downloadUrl');
}

function updateSitemapDate(sitemap, pageUrl, datePublished) {
    const escapedUrl = pageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return replaceOnce(
        sitemap,
        new RegExp(`(<loc>${escapedUrl}</loc>\\s*<lastmod>)[^<]+`),
        `$1${datePublished}`,
        `sitemap lastmod for ${pageUrl}`
    );
}

const [navigatorRelease, trendsRelease] = await Promise.all([
    loadLatestRelease(repositories.navigator),
    loadLatestRelease(repositories.trends)
]);

let navigatorHtml = await readFile(sourcePath, 'utf8');
navigatorHtml = updateNavigatorReleaseMetadata(navigatorHtml, navigatorRelease);
await writeFile(sourcePath, navigatorHtml);

let sitemap = await readFile(sitemapPath, 'utf8');
sitemap = updateSitemapDate(sitemap, 'https://miminavi.tech/', navigatorRelease.datePublished);
sitemap = updateSitemapDate(sitemap, 'https://miminavi.tech/trends', trendsRelease.datePublished);
await writeFile(sitemapPath, sitemap);

let trendsHtml = navigatorHtml;
const title = 'MiMiTrends — Local-First Market Anomaly Scanner for US and European Stocks';
const description = 'Local-first Kotlin and JavaFX stock scanner with performance-led discovery, fresh anomaly ranking, repeating short-cycle detection, and explainable US and European market analysis.';
const keywords = 'MiMiTrends, market anomaly scanner, live stock leader discovery, stock performance scanner, most traded stocks, repeating price cycle detector, unusual price movement, momentum scanner, US stock scanner, European stock scanner, Kotlin desktop app, JavaFX trading software, local-first market analysis, OHLCV scanner, volume anomaly, V-shaped reversal detector, SQLite market analytics';
const imageUrl = 'https://miminavi.tech/images/trends/MainWindow.png';
const pageUrl = 'https://miminavi.tech/trends';

trendsHtml = replaceOnce(trendsHtml, /<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title');
trendsHtml = replaceOnce(trendsHtml, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description');
trendsHtml = replaceOnce(trendsHtml, /<meta name="application-name" content="[^"]*">/, '<meta name="application-name" content="MiMiTrends">', 'application name');
trendsHtml = replaceOnce(trendsHtml, /<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${keywords}">`, 'keywords');
trendsHtml = replaceOnce(trendsHtml, /<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="MiMiTrends">', 'mobile application title');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:site_name" content="[^"]*">/, '<meta property="og:site_name" content="MiMiTrends">', 'Open Graph site name');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, 'Open Graph title');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'Open Graph description');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`, 'Open Graph URL');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${imageUrl}">`, 'Open Graph image');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="MiMiTrends anomaly scanner and signal chart">', 'Open Graph image alt');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1696">', 'Open Graph image width');
trendsHtml = replaceOnce(trendsHtml, /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="1263">', 'Open Graph image height');
trendsHtml = replaceOnce(trendsHtml, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`, 'Twitter title');
trendsHtml = replaceOnce(trendsHtml, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`, 'Twitter description');
trendsHtml = replaceOnce(trendsHtml, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${imageUrl}">`, 'Twitter image');
trendsHtml = replaceOnce(trendsHtml, /<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="MiMiTrends anomaly scanner and signal chart">', 'Twitter image alt');
trendsHtml = replaceOnce(trendsHtml, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`, 'canonical URL');
trendsHtml = replaceOnce(trendsHtml, /(<link rel="icon"[^>]*href=")[^"]*("[^>]*>)/, '$1/images/trends/AppIcon-1024.png$2', 'favicon');

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
    softwareVersion: trendsRelease.version,
    datePublished: trendsRelease.datePublished,
    downloadUrl: trendsRelease.downloadUrl,
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'EUR'},
    author: {
        '@type': 'Person',
        name: 'Iakov Senatov',
        url: 'https://www.linkedin.com/in/iakov-senatov-07060765/'
    }
};

trendsHtml = trendsHtml.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
const structuredDataTag = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
trendsHtml = replaceOnce(trendsHtml, /(<script src="\/analytics\.js" defer><\/script>)/, `${structuredDataTag}$1`, 'analytics script insertion point');

const staticFallback = `<div class="seo-static-fallback"><h1>MiMiTrends</h1><p>${description}</p><p>Discover current US and European market leaders, inspect fresh anomaly signals and repeating short cycles, and keep scanner history and imported transaction context locally in SQLite.</p><a href="https://github.com/senatov/mimiTrends/releases">Download MiMiTrends from GitHub</a></div>`;
trendsHtml = trendsHtml.replace(/<app-root>\s*<noscript>[\s\S]*?<\/noscript>/, '<app-root>');
trendsHtml = replaceOnce(trendsHtml, /<app-root>/, `<app-root>${staticFallback}`, 'application root');

await mkdir(trendsDirectory, {recursive: true});
await writeFile(trendsPath, trendsHtml);
console.log(`Rendered current release metadata: ${sourcePath}`);
console.log(`Rendered current release metadata: ${trendsPath}`);
console.log(`Updated release dates: ${sitemapPath}`);
