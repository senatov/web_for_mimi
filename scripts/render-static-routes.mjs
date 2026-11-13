import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {load} from 'cheerio';

const outputDirectory = join(process.cwd(), 'dist', 'web-for-mimi');
const sourcePath = join(outputDirectory, 'index.html');
const sitemapPath = join(outputDirectory, 'sitemap.xml');
const trendsDirectory = join(outputDirectory, 'mimitrendsios');
const trendsPath = join(trendsDirectory, 'index.html');

const repositories = {
    navigator: 'senatov/MiMiNavigator',
    trends: 'senatov/mimiTrendsIOS'
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
    const parts = release.version.split('.').map(Number);
    const finalMacOS26Release = [0, 9, 1, 2];
    const firstDifference = parts.findIndex((part, index) => part !== finalMacOS26Release[index]);
    const requiresMacOS27 = parts.length === 4 && parts.every(Number.isInteger)
        && firstDifference >= 0 && parts[firstDifference] > finalMacOS26Release[firstDifference];
    updated = replaceOnce(updated, /("softwareRequirements"\s*:\s*)"[^"]*"/, `$1"macOS ${requiresMacOS27 ? 27 : 26} or newer"`, 'MiMiNavigator softwareRequirements');
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
sitemap = updateSitemapDate(sitemap, 'https://miminavi.tech/media-converter', navigatorRelease.datePublished);
sitemap = updateSitemapDate(sitemap, 'https://miminavi.tech/mimitrendsios', trendsRelease.datePublished);
await writeFile(sitemapPath, sitemap);

let trendsHtml = navigatorHtml;
// A direct visit to this static route must still restore Navigator metadata
// when the visitor switches projects without a full page reload.
const $navigator = load(navigatorHtml);
const navigatorSnapshot = {
    title: $navigator('title').text(),
    canonical: $navigator('link[rel="canonical"]').attr('href'),
    favicon: $navigator('link[rel="icon"]').attr('href'),
    meta: $navigator('meta[name], meta[property]').toArray().map(element => ({
        attribute: element.attribs.name ? 'name' : 'property',
        key: element.attribs.name || element.attribs.property,
        content: element.attribs.content || ''
    })),
    structuredData: $navigator('script[type="application/ld+json"]').toArray().map(element => $navigator(element).html())
};
const navigatorSnapshotTag = `<script id="navigator-metadata" type="application/json">${JSON.stringify(navigatorSnapshot).replace(/</g, '\\u003c')}</script>`;
const title = 'mimiTrendsIOS — SwiftUI market radar for iPad and Mac';
const description = 'A SwiftUI prototype for iPad and macOS 27+: market radar, source telemetry, saved signals and price charts. Download the notarized Mac DMG; iPad App Store release is in preparation.';
const keywords = 'mimiTrendsIOS, SwiftUI, iPad market radar, macOS market radar, stock charts';
const imageUrl = 'https://miminavi.tech/images/trends/AppIcon-1024.png';
const pageUrl = 'https://miminavi.tech/mimitrendsios';
const metadata = [
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title'],
    [/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description'],
    [/<meta name="application-name" content="[^"]*">/, '<meta name="application-name" content="mimiTrendsIOS">', 'application name'],
    [/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${keywords}">`, 'keywords'],
    [/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="mimiTrendsIOS">', 'mobile application title'],
    [/<meta property="og:site_name" content="[^"]*">/, '<meta property="og:site_name" content="mimiTrendsIOS">', 'Open Graph site name'],
    [/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, 'Open Graph title'],
    [/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'Open Graph description'],
    [/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`, 'Open Graph URL'],
    [/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${imageUrl}">`, 'Open Graph image'],
    [/<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="mimiTrendsIOS application icon">', 'Open Graph image alt'],
    [/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`, 'Twitter title'],
    [/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`, 'Twitter description'],
    [/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${imageUrl}">`, 'Twitter image'],
    [/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="mimiTrendsIOS application icon">', 'Twitter image alt'],
    [/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`, 'canonical URL'],
    [/(<link rel="icon"[^>]*href=")[^"]*("[^>]*>)/, '$1/images/trends/AppIcon-1024.png$2', 'favicon']
];
for (const [pattern, replacement, label] of metadata) {
    trendsHtml = replaceOnce(trendsHtml, pattern, replacement, label);
}
const structuredData = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: 'mimiTrendsIOS', applicationCategory: 'FinanceApplication',
    operatingSystem: ['iPadOS', 'macOS'],
    softwareRequirements: 'macOS 27 or newer for the downloadable DMG',
    softwareVersion: trendsRelease.version,
    datePublished: trendsRelease.datePublished,
    downloadUrl: trendsRelease.downloadUrl,
    url: pageUrl, codeRepository: 'https://github.com/senatov/mimiTrendsIOS',
    image: imageUrl,
    screenshot: [
        'https://miminavi.tech/images/trends/00.png',
        'https://miminavi.tech/images/trends/01.png',
        'https://miminavi.tech/images/trends/03.png',
        'https://miminavi.tech/images/trends/04.png',
        'https://miminavi.tech/images/trends/05.png',
        'https://miminavi.tech/images/trends/06.jpg',
        'https://miminavi.tech/images/trends/07.png',
    ],
    programmingLanguage: 'Swift', description,
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'EUR'},
    author: {'@type': 'Person', name: 'Iakov Senatov', url: 'https://www.linkedin.com/in/iakov-senatov-07060765/'}
};
trendsHtml = trendsHtml.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
const structuredDataTag = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
trendsHtml = replaceOnce(trendsHtml, /(<script src="\/analytics\.js" defer><\/script>)/, `${navigatorSnapshotTag}${structuredDataTag}$1`, 'analytics script insertion point');
const staticFallback = `<div class="seo-static-fallback"><h1>mimiTrendsIOS</h1><p>${description}</p><p>SwiftUI market radar for iPad and Mac. The previous Kotlin prototype is archived. The current notarized DMG requires macOS 27 or newer.</p><a href="${trendsRelease.downloadUrl}">Download the Mac release</a> · <a href="https://github.com/senatov/mimiTrendsIOS">Current source</a></div>`;
trendsHtml = trendsHtml.replace(/<app-root>\s*<noscript>[\s\S]*?<\/noscript>/, '<app-root>');
trendsHtml = replaceOnce(trendsHtml, /<app-root>/, `<app-root>${staticFallback}`, 'application root');
await mkdir(trendsDirectory, {recursive: true});
await writeFile(trendsPath, trendsHtml);
console.log(`Rendered current release metadata: ${sourcePath}`);
console.log(`Rendered current release metadata: ${trendsPath}`);
console.log(`Updated release dates: ${sitemapPath}`);
