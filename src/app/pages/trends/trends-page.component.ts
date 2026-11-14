import {CommonModule, DOCUMENT} from '@angular/common';
import {
        AfterViewInit,
        ChangeDetectionStrategy,
        ChangeDetectorRef,
        Component,
        CUSTOM_ELEMENTS_SCHEMA,
        ElementRef,
        inject,
        OnDestroy,
        OnInit,
        ViewChild,
        ViewEncapsulation
} from '@angular/core';
import {RouterLink} from '@angular/router';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import {register, SwiperContainer} from 'swiper/element/bundle';
import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GitHubLatestRelease} from '../../github.models';



register();



interface ProductScreenshot {
        src: string;
        alt: string;
        title: string;
        description: string;
        width: number;
        height: number;
}



interface ReleaseCommit {
        hash: string;
        subject: string;
        details: string;
}



const pageUrl = 'https://miminavi.tech/mimitrendsios';
const repositoryUrl = 'https://github.com/senatov/mimiTrendsIOS';
const iconUrl = 'https://miminavi.tech/images/trends/AppIcon-1024.png';
const title = 'mimiTrendsIOS — SwiftUI market radar for iPad and Mac';
const description = 'A SwiftUI market radar for iPad and macOS 27+: Yahoo candle signals, source status, a local watchlist and price charts. The notarized Mac DMG is available; iPad App Store release is in preparation.';



@Component({
        selector: 'app-trends-page',
        standalone: true,
        imports: [CommonModule, RouterLink],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        templateUrl: './trends-page.component.html',
        styleUrls: ['../../styles/app.css', '../../styles/trends/page.css'],
        encapsulation: ViewEncapsulation.None,
        changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendsPageComponent implements OnInit, AfterViewInit, OnDestroy {
        private readonly gitHubService = inject(GitHubService);
        private readonly cdr = inject(ChangeDetectorRef);
        private readonly document = inject(DOCUMENT);
        @ViewChild('gallery') private gallery?: ElementRef<SwiperContainer>;
        private lightbox?: PhotoSwipeLightbox;
        protected readonly repositoryUrl = repositoryUrl;
        protected readonly releasesUrl = `${repositoryUrl}/releases`;
        protected readonly archiveUrl = 'https://github.com/senatov/mimiTrends';
        protected readonly linkedInUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
        protected readonly screenshots: ProductScreenshot[] = [
                {
                        src: '/images/trends/001.png',
                        alt: 'Mac Radar with recent signals, source status, market candidates, and an Endeavour Silver candle chart',
                        title: 'Radar and sources',
                        description: 'Review confirmed candle signals, source status, candidates, and a selected chart together.',
                        width: 1239,
                        height: 1129
                },
                {
                        src: '/images/trends/002.png',
                        alt: 'Mac Radar table of recent price moves above a selected candlestick chart and volume bars',
                        title: 'Signals and price history',
                        description: 'Sort recent moves and inspect the selected symbol’s candles, moving averages, and volume.',
                        width: 1241,
                        height: 1160
                },
                {
                        src: '/images/trends/003.png',
                        alt: 'Expanded Mac Radar table showing recent drops, reversals, and sustained rises above a candle chart',
                        title: 'Expanded Radar',
                        description: 'Compare company, event, move, time window, price, and signal age in the sortable table.',
                        width: 1239,
                        height: 1129
                },
                {
                        src: '/images/trends/004.png',
                        alt: 'Watchlist editor over Radar with saved ticker symbols and add, edit, and delete controls',
                        title: 'Local watchlist',
                        description: 'Add, correct, or remove symbols without leaving the Radar workspace.',
                        width: 1355,
                        height: 1218
                },
                {
                        src: '/images/trends/005.png',
                        alt: 'Rapid moves settings with short-window, confirmed reversal, smooth rise, and volume thresholds',
                        title: 'Signal rules',
                        description: 'Adjust move thresholds, confirmation, and volume checks in Settings.',
                        width: 1355,
                        height: 1218
                },
                {
                        src: '/images/trends/006.png',
                        alt: 'Market data provider settings with Yahoo, wallstreetONLINE, Lang and Schwarz, TraderFox, and boerse.de sources',
                        title: 'Market data sources',
                        description: 'Inspect source addresses and configure ranking inputs and scan priority.',
                        width: 1355,
                        height: 1218
                },
                {
                        src: '/images/trends/007.png',
                        alt: 'Market data provider settings with source addresses, ranking inputs, and scan priority',
                        title: 'Provider configuration',
                        description: 'Review source addresses and choose which ranking inputs feed the Radar.',
                        width: 1355,
                        height: 1218
                }
        ];
        protected activeScreenshot = 0;
        protected latestVersion = 'Latest release';
        protected latestReleaseDate = 'See GitHub for the publication date';
        protected latestDmgUrl = this.releasesUrl;
        protected latestReleaseUrl = this.releasesUrl;
        protected recentCommits: RecentCommitViewModel[] = [];
        protected releaseCommits: ReleaseCommit[] = [];



        ngOnInit(): void {
                this.applySeoMetadata();
                void Promise.all([this.loadRelease(), this.loadCommits()]);
        }



        ngAfterViewInit(): void {
                const gallery = this.gallery?.nativeElement;
                if (!gallery) return;
                const reducedMotion = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
                Object.assign(gallery, {
                        slidesPerView: 'auto', centeredSlides: true, spaceBetween: 20, speed: reducedMotion ? 0 : 600,
                        grabCursor: true, watchOverflow: true,
                        mousewheel: {enabled: true, releaseOnEdges: true, thresholdDelta: 8},
                        keyboard: {enabled: true, onlyInViewport: true},
                        a11y: {enabled: true, prevSlideMessage: 'Previous screenshot', nextSlideMessage: 'Next screenshot'}
                });
                gallery.addEventListener('swiperslidechange', this.onSlideChange);
                gallery.initialize();

                this.lightbox = new PhotoSwipeLightbox({
                        gallery: '#trends-gallery', children: 'a.trends-gallery-image',
                        pswpModule: () => import('photoswipe'),
                        bgOpacity: 0.9, showHideAnimationType: reducedMotion ? 'none' : 'zoom', wheelToZoom: true
                });
                this.lightbox.on('change', () => {
                        const index = this.lightbox?.pswp?.currIndex;
                        if (index === undefined) return;
                        this.gallery?.nativeElement.swiper?.slideTo(index, 0);
                        this.activeScreenshot = index;
                        this.cdr.markForCheck();
                });
                this.lightbox.init();
        }



        ngOnDestroy(): void {
                this.gallery?.nativeElement.removeEventListener('swiperslidechange', this.onSlideChange);
                this.lightbox?.destroy();
        }



        protected trackCommit(_: number, commit: RecentCommitViewModel): string {
                return commit.hash;
        }



        protected showScreenshot(index: number): void {
                this.gallery?.nativeElement.swiper.slideTo(index);
        }



        protected nextScreenshot(): void {
                this.gallery?.nativeElement.swiper.slideNext();
        }



        protected previousScreenshot(): void {
                this.gallery?.nativeElement.swiper.slidePrev();
        }



        private readonly onSlideChange = (event: Event): void => {
                this.activeScreenshot = (event.target as SwiperContainer).swiper.activeIndex;
                this.cdr.markForCheck();
        };



        private async loadRelease(): Promise<void> {
                const release: GitHubLatestRelease | null = await this.gitHubService.loadLatestRelease('trendsios');
                if (release) {
                        const dmg = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
                        this.latestVersion = release.tag_name || this.latestVersion;
                        this.latestDmgUrl = dmg?.browser_download_url || release.html_url || this.latestDmgUrl;
                        this.latestReleaseUrl = release.html_url || this.releasesUrl;
                        this.releaseCommits = this.parseReleaseCommits(release.body || '');
                        const publishedAt = release.published_at || release.created_at;
                        if (publishedAt) this.latestReleaseDate = this.gitHubService.formatReleaseDate(publishedAt);
                        this.applySeoMetadata();
                }
                this.cdr.markForCheck();
        }



        private async loadCommits(): Promise<void> {
                this.recentCommits = await this.gitHubService.loadRecentCommits('trendsios');
                this.cdr.markForCheck();
        }



        private parseReleaseCommits(body: string): ReleaseCommit[] {
                const commits: ReleaseCommit[] = [];
                for (const line of body.split(/\r?\n/)) {
                        const match = /^- \*\*(.+)\*\* \(\x60([0-9a-f]{8,40})\x60\)$/.exec(line);
                        if (match) {
                                commits.push({subject: match[1], hash: match[2], details: ''});
                        } else if (commits.length && line.startsWith('  >')) {
                                const text = line.slice(3).trim();
                                commits[commits.length - 1].details += text ? `${text} ` : '\n';
                        }
                }
                return commits.map(commit => ({...commit, details: commit.details.trim()}));
        }



        private applySeoMetadata(): void {
                this.document.title = title;
                const metas: Array<['name' | 'property', string, string]> = [
                        ['name', 'description', description], ['name', 'application-name', 'mimiTrendsIOS'],
                        ['name', 'keywords', 'mimiTrendsIOS, SwiftUI, iPad market radar, macOS market radar, stock charts'],
                        ['name', 'apple-mobile-web-app-title', 'mimiTrendsIOS'], ['property', 'og:site_name', 'mimiTrendsIOS'],
                        ['property', 'og:title', title], ['property', 'og:description', description],
                        ['property', 'og:url', pageUrl], ['property', 'og:image', iconUrl],
                        ['property', 'og:image:alt', 'mimiTrendsIOS application icon'],
                        ['property', 'og:image:width', '1024'], ['property', 'og:image:height', '1024'],
                        ['property', 'og:image:type', 'image/png'], ['name', 'twitter:title', title],
                        ['name', 'twitter:description', description], ['name', 'twitter:image', iconUrl],
                        ['name', 'twitter:image:alt', 'mimiTrendsIOS application icon']
                ];
                for (const [attribute, key, content] of metas) {
                        this.document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)?.setAttribute('content', content);
                }
                this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', pageUrl);
                this.document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', '/images/trends/AppIcon-1024.png');
                this.document.querySelectorAll('script[type="application/ld+json"]').forEach(element => element.remove());
                const structuredData = this.document.createElement('script');
                structuredData.type = 'application/ld+json';
                structuredData.text = JSON.stringify({
                        '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'mimiTrendsIOS',
                        applicationCategory: 'FinanceApplication', operatingSystem: ['iPadOS', 'macOS'],
                        softwareRequirements: 'macOS 27 or newer for the downloadable DMG',
                        ...(this.latestVersion === 'Latest release' ? {} : {softwareVersion: this.latestVersion}),
                        url: pageUrl, downloadUrl: this.latestDmgUrl,
                        codeRepository: repositoryUrl, image: iconUrl,
                        screenshot: this.screenshots.map(screenshot => `https://miminavi.tech${screenshot.src}`),
                        programmingLanguage: 'Swift', description
                });
                this.document.head.appendChild(structuredData);
        }
}
