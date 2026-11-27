import screenshots from './trends-screenshots.json';

const pageUrl = 'https://miminavi.tech/mimitrendsios';
export const trendsRepositoryUrl = 'https://github.com/senatov/mimiTrendsIOS';
const iconUrl = 'https://miminavi.tech/images/trends/AppIcon-1024.png';
const title = 'mimiTrendsIOS — SwiftUI market radar for iPad and Mac';
const description = 'A SwiftUI market radar for iPad and macOS 27+: TradingView candidates checked against EIX observations, Yahoo candle signals, a local watchlist and charts. Mac DMG available; iPad App Store release in preparation.';

export function applyTrendsMetadata(document: Document, latestVersion: string, latestDmgUrl: string): void {
    document.title = title;
    const metas: Array<['name' | 'property', string, string]> = [
        ['name', 'description', description],
        ['name', 'application-name', 'mimiTrendsIOS'],
        ['name', 'keywords', 'mimiTrendsIOS, SwiftUI, iPad market radar, macOS market radar, stock charts'],
        ['name', 'apple-mobile-web-app-title', 'mimiTrendsIOS'],
        ['property', 'og:site_name', 'mimiTrendsIOS'],
        ['property', 'og:title', title],
        ['property', 'og:description', description],
        ['property', 'og:url', pageUrl],
        ['property', 'og:image', iconUrl],
        ['property', 'og:image:alt', 'mimiTrendsIOS application icon'],
        ['property', 'og:image:width', '1024'],
        ['property', 'og:image:height', '1024'],
        ['property', 'og:image:type', 'image/png'],
        ['name', 'twitter:title', title],
        ['name', 'twitter:description', description],
        ['name', 'twitter:image', iconUrl],
        ['name', 'twitter:image:alt', 'mimiTrendsIOS application icon']
    ];
    for (const [attribute, key, content] of metas) {
        document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)?.setAttribute('content', content);
    }
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', pageUrl);
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', '/images/trends/AppIcon-1024.png');
    document.querySelectorAll('script[type="application/ld+json"]').forEach(element => element.remove());
    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'mimiTrendsIOS',
        applicationCategory: 'FinanceApplication',
        operatingSystem: ['iPadOS', 'macOS'],
        softwareRequirements: 'macOS 27 or newer for the downloadable DMG',
        ...(latestVersion === 'Latest release' ? {} : {softwareVersion: latestVersion}),
        url: pageUrl,
        downloadUrl: latestDmgUrl,
        codeRepository: trendsRepositoryUrl,
        image: iconUrl,
        screenshot: screenshots.map(screenshot => `https://miminavi.tech${screenshot.src}`),
        programmingLanguage: 'Swift',
        description
    });
    document.head.appendChild(structuredData);
}
