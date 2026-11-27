//
//  navigator-page.component.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Route component for the MiMiNavigator landing page.
//

import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {PreviewDialogComponent, PreviewDialogData} from '../../preview-dialog.component';
import {GitHubReleaseAsset} from '../../github.models';
import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GalleriaModule} from 'primeng/galleria';
import {PopoverModule} from 'primeng/popover';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {TagModule} from 'primeng/tag';
import {RouterLink} from '@angular/router';
import {ProjectSwitcherComponent} from '../../project-switcher.component';
import {highlightKeywordsHtml, SeoKeywordHighlightDirective} from '../../seo-keyword-highlight.directive';
import {PageMetadataService} from '../../page-metadata.service';
import {navigatorMinimumMacOS} from '../../navigator-platform';
import {coreToolCards, HighlightCard, productDetailCards} from './navigator-feature-cards';
import {GalleryImageItem, navigatorGalleryImages, navigatorImageBasePath} from './navigator-gallery';
import {createReleaseHeadline, extractReleaseNoteSections, extractReleaseSummary, ReleaseNoteSection} from './navigator-release-notes';
import {register, SwiperContainer} from 'swiper/element/bundle';

register();

type AnalyticsEventName =
    | 'download_click'
    | 'github_click'
    | 'homebrew_copy'
    | 'linkedin_click'
    | 'releases_click'
    | 'screenshot_open';

@Component({
        selector: 'app-navigator-page',
        standalone: true,
        imports: [SeoKeywordHighlightDirective, CommonModule, MatDialogModule, GalleriaModule, PopoverModule, CardModule, DividerModule, TagModule, RouterLink, ProjectSwitcherComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        templateUrl: './navigator-page.component.html',
        styleUrls: ['../../styles/app.css', '../../styles/trends/page.css', '../../styles/navigator/prime.css', '../../styles/navigator/gallery.css'],
        changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigatorPageComponent implements OnInit, AfterViewInit, OnDestroy {
        protected readonly highlightKeywordsHtml = highlightKeywordsHtml;
        private readonly dialog = inject(MatDialog);
        private readonly cdr = inject(ChangeDetectorRef);
        private readonly gitHubService = inject(GitHubService);
        private readonly pageMetadata = inject(PageMetadataService);
        @ViewChild('gallery') private gallery?: ElementRef<SwiperContainer>;

        protected latestVersion = 'Loading...';
        protected latestReleaseDate = 'Loading...';
        protected latestReleaseAge = 'Checking release age...';
        protected latestReleaseHeadline = 'Latest release is loading...';
        protected latestReleaseSummary = 'Release details are loading from GitHub.';
        protected latestDmgReleaseNote = '';
        protected latestDmgFileDate = 'Checking DMG file date...';
        protected latestDmgFileAge = '';
        protected latestDmgUrl = 'https://github.com/senatov/MiMiNavigator/releases';
        protected readonly releasesPageUrl = 'https://github.com/senatov/MiMiNavigator/releases';
        protected latestReleaseUrl = this.releasesPageUrl;
        protected minimumMacOSVersion = 'macOS 27';
        protected readonly linkedInProfileUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
        private readonly previewDialogHint = 'Press Esc or click outside to close';
        private homebrewCopyTimerId: number | null = null;
        private latestReleaseIsoDate: string | null = null;
        private latestDmgIsoDate: string | null = null;
        private releaseAgeTimerId: number | null = null;

        protected recentCommits: RecentCommitViewModel[] = [];
        protected selectedHighlight: HighlightCard | null = null;
        protected readonly productDetailCards = productDetailCards;
        protected readonly coreToolCards = coreToolCards;
        protected releaseNotesLoading = true;
        protected releaseNoteSections: ReleaseNoteSection[] = [];
        protected heroGalleryVisible = false;
        protected heroGalleryActiveIndex = 0;
        protected heroCarouselIndex = 0;
        protected homebrewCopied = false;
        protected homebrewCopyStatus = '';
        protected readonly galleryResponsiveOptions = [
                {breakpoint: '900px', numVisible: 4},
                {breakpoint: '600px', numVisible: 2}
        ];
        protected readonly heroGalleryImages: GalleryImageItem[] = navigatorGalleryImages;
        protected readonly displayPixelRatio = Math.max(1, window.devicePixelRatio || 1);
        protected readonly isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        protected readonly homebrewInstallCommand = 'brew tap senatov/tap >/dev/null && "$(brew --repo senatov/tap)/scripts/install-miminavigator"';
        protected readonly downloadPitchText = 'Work in two persistent panels with exact active-panel mirroring, TC-style hotkeys, document content search, read-only Git status, List, Preview, and Tree views, remote servers, archive folders, media conversion, and cloud sharing. The native SwiftUI + AppKit app is free, open source, and distributed as a signed, notarized DMG.';

        ngOnInit(): void {
                this.pageMetadata.restoreNavigator();
                void Promise.all([
                        this.loadLatestRelease(),
                        this.loadRecentCommits()
                ]);
        }

        protected toggleHighlight(item: HighlightCard): void {
                this.selectedHighlight = this.selectedHighlight === item ? null : item;
        }

        protected onHighlightKeydown(event: KeyboardEvent, item: HighlightCard): void {
                if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.toggleHighlight(item);
                }
        }

        ngAfterViewInit(): void {
                const gallery = this.gallery?.nativeElement;
                if (!gallery) return;
                const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                Object.assign(gallery, {
                        slidesPerView: 'auto', centeredSlides: true, spaceBetween: 20,
                        speed: reducedMotion ? 0 : 500, grabCursor: true, watchOverflow: true,
                        keyboard: {enabled: true, onlyInViewport: true},
                        a11y: {enabled: true, prevSlideMessage: 'Previous screenshot', nextSlideMessage: 'Next screenshot'}
                });
                gallery.addEventListener('swiperslidechange', this.onSlideChange);
                gallery.initialize();
        }

        private readonly onSlideChange = () => {
                const index = this.gallery?.nativeElement.swiper?.activeIndex ?? 0;
                this.heroCarouselIndex = index;
                this.heroGalleryActiveIndex = index;
                this.cdr.markForCheck();
        };

        ngOnDestroy(): void {
                this.gallery?.nativeElement.removeEventListener('swiperslidechange', this.onSlideChange);
                this.stopReleaseAgeTimer();
                this.stopHomebrewCopyTimer();
        }

        protected trackDownloadClick(location: 'hero' | 'pricing'): void {
                this.trackEvent('download_click', {
                        location,
                        version: this.latestVersion,
                        releaseAge: this.latestReleaseAge,
                        macOS: this.minimumMacOSVersion
                });
        }

        protected trackGitHubClick(location: 'hero' | 'footer'): void {
                this.trackEvent('github_click', {
                        location,
                        version: this.latestVersion
                });
        }

        protected trackLinkedInClick(location: 'hero' | 'footer'): void {
                this.trackEvent('linkedin_click', {
                        location,
                        profile: this.linkedInProfileUrl
                });
        }

        protected trackReleasesClick(location: 'pricing'): void {
                this.trackEvent('releases_click', {
                        location,
                        version: this.latestVersion
                });
        }

        protected async copyHomebrewCommands(): Promise<void> {
                this.stopHomebrewCopyTimer();
                try {
                        await navigator.clipboard.writeText(this.homebrewInstallCommand);
                        this.homebrewCopied = true;
                        this.homebrewCopyStatus = 'Command copied. Paste it into Terminal and press Return.';
                        this.trackEvent('homebrew_copy', {location: 'pricing'});
                } catch {
                        this.homebrewCopied = false;
                        this.homebrewCopyStatus = 'Copy was unavailable. Select the command above and copy it manually.';
                }
                this.cdr.markForCheck();
                this.homebrewCopyTimerId = window.setTimeout(() => {
                        this.homebrewCopied = false;
                        this.homebrewCopyStatus = '';
                        this.homebrewCopyTimerId = null;
                        this.cdr.markForCheck();
                }, 2_400);
        }

        protected openHeroGallery(event?: Event): void {
                event?.preventDefault();
                event?.stopPropagation();
                this.heroGalleryActiveIndex = this.heroCarouselIndex;
                this.heroGalleryVisible = true;

                this.trackEvent('screenshot_open', {
                        image: this.heroGalleryCurrentItem.itemImageSrc,
                        gallerySize: this.heroGalleryImages.length
                });

                this.cdr.markForCheck();
        }

        protected onHeroGalleryActiveIndexChange(index: number): void {
                this.selectHeroGalleryImage(index);
        }

        protected selectHeroGalleryImage(index: number): void {
                if (index < 0 || index >= this.heroGalleryImages.length) return;
                this.heroCarouselIndex = index;
                this.heroGalleryActiveIndex = index;
                this.gallery?.nativeElement.swiper?.slideTo(index);
                this.cdr.markForCheck();
        }

        protected showPreviousHeroGalleryImage(event?: Event): void {
                event?.preventDefault();
                event?.stopPropagation();

                const nextIndex = (this.heroCarouselIndex - 1 + this.heroGalleryImages.length) % this.heroGalleryImages.length;
                this.selectHeroGalleryImage(nextIndex);
        }

        protected showNextHeroGalleryImage(event?: Event): void {
                event?.preventDefault();
                event?.stopPropagation();

                const nextIndex = (this.heroCarouselIndex + 1) % this.heroGalleryImages.length;
                this.selectHeroGalleryImage(nextIndex);
        }

        protected onHeroGalleryKeydown(event: KeyboardEvent): void {
                if (event.key === 'ArrowLeft') {
                        this.showPreviousHeroGalleryImage(event);
                        return;
                }

                if (event.key === 'ArrowRight') {
                        this.showNextHeroGalleryImage(event);
                        return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.openHeroGallery();
                }
        }

        protected openHeroGalleryAt(index: number, event?: Event): void {
                event?.preventDefault();
                event?.stopPropagation();

                this.selectHeroGalleryImage(index);
                this.openHeroGallery();
        }

        protected trackRecentCommit(_: number, commit: RecentCommitViewModel): string {
                return commit.hash;
        }

        protected trackReleaseNoteSection(_: number, section: ReleaseNoteSection): string {
                return section.title;
        }

        protected trackReleaseNoteItem(_: number, item: string): string {
                return item;
        }

        protected get heroGalleryCurrentItem(): GalleryImageItem {
                return this.heroGalleryImages[this.heroCarouselIndex];
        }

        protected get heroGalleryDialogItem(): GalleryImageItem {
                return this.heroGalleryImages[this.heroGalleryActiveIndex];
        }

        protected get heroGalleryProgressLabel(): string {
                return `${this.heroCarouselIndex + 1} / ${this.heroGalleryImages.length}`;
        }

        protected get heroGalleryDialogProgressLabel(): string {
                return `${this.heroGalleryActiveIndex + 1} / ${this.heroGalleryImages.length}`;
        }

        protected onHeroGalleryVisibleChange(visible: boolean): void {
                this.heroGalleryVisible = visible;

                if (!visible) this.selectHeroGalleryImage(this.heroGalleryActiveIndex);

                this.cdr.markForCheck();
        }

        protected openPreview(imageName: string, windowName: string): void {
                this.trackEvent('screenshot_open', {
                        image: imageName
                });

                const dialogData: PreviewDialogData = {
                        imageUrl: `${navigatorImageBasePath}/${imageName}`,
                        altText: `Preview for ${windowName}`,
                        title: windowName,
                        hint: this.previewDialogHint
                };

                this.dialog.open(PreviewDialogComponent, {
                        data: dialogData,
                        width: '96vw',
                        height: '94dvh',
                        maxWidth: '1600px',
                        maxHeight: '94dvh',
                        panelClass: 'preview-dialog-panel',
                        backdropClass: 'preview-dialog-backdrop',
                        autoFocus: 'first-tabbable',
                        restoreFocus: true,
                });
        }

        protected openGalleryDetail(): void {
                const item = this.heroGalleryDialogItem;
                this.onHeroGalleryVisibleChange(false);
                this.openPreview(item.itemImageSrc.replace('/images/', ''), item.title);
        }

        private stopHomebrewCopyTimer(): void {
                if (this.homebrewCopyTimerId === null) return;
                window.clearTimeout(this.homebrewCopyTimerId);
                this.homebrewCopyTimerId = null;
        }

        private trackEvent(name: AnalyticsEventName, params: Record<string, unknown> = {}): void {
                window.gtag?.('event', name, params);
        }

        private async loadLatestRelease(): Promise<void> {
                const release = await this.gitHubService.loadLatestRelease();
                this.releaseNotesLoading = false;

                if (!release) {
                        this.applyReleaseFallback();
                        return;
                }

                const dmgAsset = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
                const releaseDate = release.published_at || release.created_at;

                this.latestVersion = release.tag_name || 'Latest release';
                this.minimumMacOSVersion = `macOS ${navigatorMinimumMacOS(this.latestVersion)}`;
                this.latestReleaseHeadline = createReleaseHeadline(this.latestVersion);
                this.latestReleaseSummary = extractReleaseSummary(release.body);
                this.latestDmgUrl = dmgAsset?.browser_download_url || release.html_url || this.releasesPageUrl;
                this.latestReleaseUrl = release.html_url || this.releasesPageUrl;
                this.releaseNoteSections = extractReleaseNoteSections(release.body);
                this.pageMetadata.updateNavigatorRelease(this.latestVersion, releaseDate, this.latestDmgUrl);

                this.applyReleaseDate(releaseDate);
                this.applyDmgDate(dmgAsset, releaseDate);
                this.cdr.markForCheck();
        }

        private applyReleaseDate(releaseDate?: string): void {
                this.latestReleaseIsoDate = releaseDate || null;
                this.latestReleaseDate = releaseDate
                    ? this.gitHubService.formatReleaseDate(releaseDate)
                    : 'Unknown release date';
                this.updateReleaseAge();

                if (releaseDate) {
                        this.startReleaseAgeTimer();
                } else {
                        this.stopReleaseAgeTimer();
                }
        }

        private applyDmgDate(asset: GitHubReleaseAsset | undefined, releaseDate?: string): void {
                const dmgDate = asset?.updated_at || asset?.created_at;
                this.latestDmgIsoDate = dmgDate || releaseDate || null;
                this.latestDmgFileDate = this.resolveDmgFileDate(releaseDate, dmgDate);
                this.updateDmgFileAge();
        }

        private resolveDmgFileDate(
            releaseDate?: string,
            dmgDate?: string
        ): string {
                this.latestDmgReleaseNote = '';
                if (!dmgDate) {
                        return releaseDate
                            ? this.gitHubService.formatReleaseDate(releaseDate)
                            : 'Unknown DMG file date';
                }

                const formattedDmg = this.gitHubService.formatReleaseDate(dmgDate);
                if (releaseDate && dmgDate !== releaseDate) {
                        const formattedRelease = this.gitHubService.formatReleaseDate(releaseDate);
                        if (formattedDmg !== formattedRelease) {
                                this.latestDmgReleaseNote = `release: ${formattedRelease}`;
                        }
                }

                return formattedDmg;
        }

        private async loadRecentCommits(): Promise<void> {
                this.recentCommits = await this.gitHubService.loadRecentCommits();
                this.cdr.markForCheck();
        }

        private startReleaseAgeTimer(): void {
                this.stopReleaseAgeTimer();

                this.releaseAgeTimerId = window.setInterval(() => {
                        this.updateReleaseAge();
                        this.updateDmgFileAge();
                        this.cdr.markForCheck();
                }, 60_000);
        }

        private stopReleaseAgeTimer(): void {
                if (this.releaseAgeTimerId === null) {
                        return;
                }

                window.clearInterval(this.releaseAgeTimerId);
                this.releaseAgeTimerId = null;
        }

        private updateReleaseAge(): void {
                if (!this.latestReleaseIsoDate) {
                        this.latestReleaseAge = 'Age unavailable';
                        return;
                }

                this.latestReleaseAge = this.gitHubService.formatReleaseAge(this.latestReleaseIsoDate);
        }

        private updateDmgFileAge(): void {
                if (!this.latestDmgIsoDate) {
                        this.latestDmgFileAge = '';
                        return;
                }

                this.latestDmgFileAge = this.gitHubService.formatReleaseAge(this.latestDmgIsoDate)
                    .replace('Released ', 'Updated ');
        }

        private applyReleaseFallback(): void {
                this.latestReleaseIsoDate = null;
                this.latestDmgIsoDate = null;
                this.stopReleaseAgeTimer();
                this.latestVersion = 'Latest release';
                this.latestDmgUrl = this.releasesPageUrl;
                this.latestReleaseUrl = this.releasesPageUrl;
                this.latestReleaseDate = 'Unknown release date';
                this.latestReleaseAge = 'Age unavailable';
                this.latestReleaseHeadline = 'Latest release';
                this.latestReleaseSummary = 'Release details are temporarily unavailable. Use the releases page for the current build.';
                this.latestDmgFileDate = 'Unknown DMG file date';
                this.latestDmgReleaseNote = '';
                this.latestDmgFileAge = '';
                this.releaseNoteSections = [];
                this.cdr.markForCheck();
        }
}
