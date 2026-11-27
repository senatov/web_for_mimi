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
import {ProjectSwitcherComponent} from '../../project-switcher.component';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import {register, SwiperContainer} from 'swiper/element/bundle';
import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GitHubLatestRelease} from '../../github.models';
import {SeoKeywordHighlightDirective} from '../../seo-keyword-highlight.directive';
import {applyTrendsMetadata, trendsRepositoryUrl} from './trends-metadata';
import {parseReleaseCommits, ReleaseCommit} from './trends-release-commits';
import screenshots from './trends-screenshots.json';

register();

@Component({
        selector: 'app-trends-page',
        standalone: true,
        imports: [CommonModule, RouterLink, SeoKeywordHighlightDirective, ProjectSwitcherComponent],
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
        protected readonly repositoryUrl = trendsRepositoryUrl;
        protected readonly displayPixelRatio = Math.max(1, this.document.defaultView?.devicePixelRatio || 1);
        protected readonly releasesUrl = `${trendsRepositoryUrl}/releases`;
        protected readonly archiveUrl = 'https://github.com/senatov/mimiTrends';
        protected readonly linkedInUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
        protected readonly screenshots = screenshots;
        protected activeScreenshot = 0;
        protected latestVersion = 'Latest release';
        protected latestReleaseDate = 'See GitHub for the publication date';
        protected latestDmgUrl = this.releasesUrl;
        protected latestReleaseUrl = this.releasesUrl;
        protected recentCommits: RecentCommitViewModel[] = [];
        protected releaseCommits: ReleaseCommit[] = [];

        ngOnInit(): void {
                applyTrendsMetadata(this.document, this.latestVersion, this.latestDmgUrl);
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
                        this.releaseCommits = parseReleaseCommits(release.body || '');
                        const publishedAt = release.published_at || release.created_at;
                        if (publishedAt) this.latestReleaseDate = this.gitHubService.formatReleaseDate(publishedAt);
                        applyTrendsMetadata(this.document, this.latestVersion, this.latestDmgUrl);
                }
                this.cdr.markForCheck();
        }

        private async loadCommits(): Promise<void> {
                this.recentCommits = await this.gitHubService.loadRecentCommits('trendsios');
                this.cdr.markForCheck();
        }
}
