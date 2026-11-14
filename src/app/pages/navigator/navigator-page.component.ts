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
import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GalleriaModule} from 'primeng/galleria';
import {PopoverModule} from 'primeng/popover';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {TagModule} from 'primeng/tag';
import {RouterLink} from '@angular/router';
import {SeoKeywordHighlightDirective} from '../../seo-keyword-highlight.directive';
import {PageMetadataService} from '../../page-metadata.service';
import {navigatorMinimumMacOS} from '../../navigator-platform';
import {register, SwiperContainer} from 'swiper/element/bundle';

register();



interface GalleryImageItem {
        itemImageSrc: string;
        thumbnailImageSrc: string;
        alt: string;
        title: string;
        width: number;
        height: number;
}



interface ReleaseNoteSection {
        title: string;
        items: string[];
}

interface HighlightCard {
        title: string;
        icon: string;
        emoji: string;
        description: string;
        commitUrl: string;
}



declare global {
        interface Window {
                gtag?: (...args: unknown[]) => void;
        }
}

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
        imports: [SeoKeywordHighlightDirective, CommonModule, MatDialogModule, GalleriaModule, PopoverModule, CardModule, DividerModule, TagModule, RouterLink],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        templateUrl: './navigator-page.component.html',
        styleUrls: ['../../styles/app.css', '../../styles/trends/page.css', '../../styles/navigator/prime.css', '../../styles/navigator/gallery.css'],
        changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigatorPageComponent implements OnInit, AfterViewInit, OnDestroy {
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
        private readonly previewImageBasePath = '/images';
        private readonly previewDialogHint = 'Press Esc or click outside to close';
        private readonly heroGalleryImageSpecs: Array<readonly [string, string, number, number]> = [
                ['navigator/gallery/001.png', 'MiMiNavigator Dual Panel Workspace', 1353, 1258],
                ['navigator/gallery/002.png', 'MiMiNavigator Advanced File Search', 967, 900],
                ['navigator/gallery/003.png', 'MiMiNavigator Media Converter Video', 1528, 1394],
                ['navigator/gallery/004.png', 'MiMiNavigator Server Connections', 817, 587],
                ['navigator/gallery/005.png', 'MiMiNavigator Authorized Folders Dialog', 1046, 448],
                ['navigator/gallery/006.png', 'MiMiNavigator Cloud Share Settings', 1054, 876],
                ['navigator/gallery/007.png', 'MiMiNavigator External Tools Diagnostics', 1156, 836],
                ['navigator/gallery/008.png', 'MiMiNavigator Permissions Settings', 1156, 836],
                ['navigator/gallery/009.png', 'MiMiNavigator Diff Tool Details', 1156, 836],
                ['navigator/gallery/010.png', 'MiMiNavigator Panel Settings', 1156, 836],
                ['navigator/gallery/011.png', 'MiMiNavigator Saved Server Editor', 1133, 718],
                ['navigator/gallery/012.png', 'MiMiNavigator Diff Tool Settings', 1156, 836],
                ['navigator/gallery/013.png', 'MiMiNavigator Path Completion', 1353, 1258],
                ['navigator/gallery/014.png', 'MiMiNavigator Connections Menu', 1544, 1415],
                ['navigator/gallery/015.png', 'MiMiNavigator Server Passwords', 1156, 836],
                ['navigator/gallery/016.png', 'MiMiNavigator Column Presets', 1353, 1258],
                ['navigator/gallery/017.png', 'MiMiNavigator Sidebar And Favorites', 1353, 1258],
                ['navigator/gallery/018.png', 'MiMiNavigator File Preview Panel', 1353, 1258],
                ['navigator/gallery/019.png', 'MiMiNavigator Media Converter Gif', 1528, 1394],
                ['navigator/gallery/020.png', 'MiMiNavigator Media Converter', 1528, 1394]
        ];
        private homebrewCopyTimerId: number | null = null;
        private latestReleaseIsoDate: string | null = null;
        private latestDmgIsoDate: string | null = null;
        private releaseAgeTimerId: number | null = null;

        protected recentCommits: RecentCommitViewModel[] = [];
        protected selectedHighlight: HighlightCard | null = null;
        private readonly navigatorCommit = 'https://github.com/senatov/MiMiNavigator/commits/main/';
        private readonly portalCommit = 'https://github.com/senatov/web_for_mimi/commit/da7d83b';
        protected readonly productDetailCards: HighlightCard[] = [
                {title: 'Free', icon: 'check_circle', emoji: '🎈', description: 'No purchase, subscription, or feature paywall. The portal presents the app as a free download and links directly to its current release.', commitUrl: this.portalCommit},
                {title: 'Signed & notarized', icon: 'verified_user', emoji: '🛡️', description: 'The downloadable DMG is Developer ID signed and notarized by Apple. macOS can verify the publisher and the notarization before you open it.', commitUrl: this.navigatorCommit},
                {title: 'Native macOS', icon: 'desktop_mac', emoji: '🍎', description: 'MiMiNavigator is a SwiftUI and AppKit desktop app. The current release requires macOS 27 or newer; v0.9.1.2 is the final macOS 26 version.', commitUrl: this.portalCommit},
                {title: 'Open source', icon: 'code', emoji: '🔎', description: 'The app source is public on GitHub. You can inspect implementation and release history, while the portal keeps published release information linked to GitHub.', commitUrl: this.portalCommit}
        ];
        protected readonly coreToolCards: HighlightCard[] = [
                {title: 'Dual panels', icon: 'view_column', emoji: '🧭', description: 'Keep two locations visible at once. Move or compare files while each panel retains its own tabs and browsing context.', commitUrl: this.navigatorCommit},
                {title: 'Find & clean', icon: 'manage_search', emoji: '🕵️', description: 'Find files by name or document content, then review large, empty, or leftover items. Cleanup guides explain scan scope, saved progress, and review before action.', commitUrl: this.portalCommit},
                {title: 'Multi-Rename', icon: 'drive_file_rename_outline', emoji: '✏️', description: 'Build structured filename changes for a group of files and inspect the proposed names before applying them.', commitUrl: this.navigatorCommit},
                {title: 'Remote servers', icon: 'dns', emoji: '🛰️', description: 'Save FTP and SFTP connections and browse remote locations alongside local folders. Connection details can be revisited from the app.', commitUrl: this.navigatorCommit},
                {title: 'Archives', icon: 'folder_zip', emoji: '📦', description: 'Open supported archives as folder-like locations, so you can inspect and work with their contents without first extracting everything.', commitUrl: this.navigatorCommit},
                {title: 'Media tools', icon: 'perm_media', emoji: '🎞️', description: 'Convert images, audio, and video in a focused workflow. The portal’s media guide describes supported formats and the practical steps.', commitUrl: this.portalCommit}
        ];
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
        protected readonly heroGalleryImages: GalleryImageItem[] = this.buildHeroGalleryImages();
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
                        imageUrl: `${this.previewImageBasePath}/${imageName}`,
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



        private buildHeroGalleryImages(): GalleryImageItem[] {
                return this.heroGalleryImageSpecs.map(([relativePath, title, width, height]) => {
                        return this.createGalleryImageItem(
                            relativePath,
                            title,
                            width,
                            height
                        );
                });
        }



        private createGalleryImageItem(relativePath: string, alt: string, width: number, height: number): GalleryImageItem {
                const imageUrl = `${this.previewImageBasePath}/${relativePath}`;

                return {
                        itemImageSrc: imageUrl,
                        thumbnailImageSrc: imageUrl,
                        alt,
                        title: alt,
                        width,
                        height
                };
        }



        private trackEvent(name: AnalyticsEventName, params: Record<string, unknown> = {}): void {
                window.gtag?.('event', name, params);
        }



        private async loadLatestRelease(): Promise<void> {
                const release = await this.gitHubService.loadLatestRelease();

                if (!release) {
                        this.applyReleaseFallback();
                        return;
                }

                const dmgAsset = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
                const releaseDate = release.published_at || release.created_at;

                this.latestVersion = release.tag_name || 'Latest release';
                this.minimumMacOSVersion = `macOS ${navigatorMinimumMacOS(this.latestVersion)}`;
                this.latestReleaseHeadline = this.createReleaseHeadline(this.latestVersion);
                this.latestReleaseSummary = this.extractReleaseSummary(release.body);
                this.latestDmgUrl = dmgAsset?.browser_download_url || release.html_url || this.releasesPageUrl;
                this.latestReleaseUrl = release.html_url || this.releasesPageUrl;
                this.releaseNoteSections = this.extractReleaseNoteSections(release.body);
                this.pageMetadata.updateNavigatorRelease(this.latestVersion, releaseDate, this.latestDmgUrl);

                if (releaseDate) {
                        this.latestReleaseIsoDate = releaseDate;
                        this.latestReleaseDate = this.gitHubService.formatReleaseDate(releaseDate);
                        this.updateReleaseAge();
                        this.startReleaseAgeTimer();
                } else {
                        this.latestReleaseIsoDate = null;
                        this.stopReleaseAgeTimer();
                        this.latestReleaseDate = 'Unknown release date';
                        this.latestReleaseAge = 'Age unavailable';
                }

                const dmgAssetDates = dmgAsset as { updated_at?: string | null; created_at?: string | null } | undefined;
                const dmgUpdatedAt = dmgAssetDates?.updated_at ?? null;
                const dmgCreatedAt = dmgAssetDates?.created_at ?? null;
                this.latestDmgIsoDate = dmgUpdatedAt || dmgCreatedAt || releaseDate || null;
                this.latestDmgFileDate = this.resolveDmgFileDate(releaseDate, dmgUpdatedAt, dmgCreatedAt);
                this.updateDmgFileAge();

                this.cdr.markForCheck();
        }



        private extractReleaseNoteSections(body?: string): ReleaseNoteSection[] {
                const sections: ReleaseNoteSection[] = [];
                let currentSection: ReleaseNoteSection | null = null;
                let sawReleaseTitle = false;

                for (const rawLine of (body || '').split('\n')) {
                        if (rawLine.trim() === '---') {
                                break;
                        }
                        if (/^#\s+/.test(rawLine)) {
                                if (sawReleaseTitle) {
                                        break;
                                }
                                sawReleaseTitle = true;
                                continue;
                        }
                        const headingMatch = rawLine.match(/^##\s+(.+?)\s*$/);

                        if (headingMatch) {
                                const title = headingMatch[1].trim();
                                const isChangeSection = /^(highlights|added|changed|fixed|improvements(?: since .+)?)$/i.test(title);
                                currentSection = isChangeSection ? {title, items: []} : null;

                                if (currentSection) {
                                        sections.push(currentSection);
                                }

                                continue;
                        }

                        if (!currentSection) {
                                continue;
                        }

                        const itemMatch = rawLine.match(/^-\s+(.+?)\s*$/);
                        if (itemMatch) {
                                currentSection.items.push(this.cleanReleaseNoteMarkdown(itemMatch[1]));
                        }
                }

                return sections.filter(section => section.items.length > 0);
        }



        private createReleaseHeadline(version: string): string {
                return version === 'Latest release'
                    ? 'Latest release'
                    : `Latest release: ${version}`;
        }



        private extractReleaseSummary(body?: string): string {
                const summaryLines: string[] = [];

                for (const rawLine of (body || '').split('\n')) {
                        const line = rawLine.trim();

                        if (line === '---') {
                                break;
                        }

                        if (!line || line.startsWith('#')) {
                                if (summaryLines.length > 0) {
                                        break;
                                }

                                continue;
                        }

                        if (line.startsWith('-')) {
                                if (summaryLines.length === 0) {
                                        return this.cleanReleaseNoteMarkdown(line.replace(/^-\s*/, ''))
                                            .replace(/\s+/g, ' ');
                                }

                                break;
                        }

                        summaryLines.push(line);
                }

                if (summaryLines.length === 0) {
                        return 'See the release notes below for current improvements.';
                }

                return this.cleanReleaseNoteMarkdown(summaryLines.join(' '))
                    .replace(/\s+/g, ' ');
        }



        private cleanReleaseNoteMarkdown(value: string): string {
                return value
                    .replace(/\*\*(.+?)\*\*/g, '$1')
                    .replace(/`(.+?)`/g, '$1')
                    .replace(/\s+—\s+/g, ' — ')
                    .trim();
        }



        private resolveDmgFileDate(
            releaseDate?: string | null,
            dmgUpdatedAt?: string | null,
            dmgCreatedAt?: string | null
        ): string {
                this.latestDmgReleaseNote = '';
                const dmgDate = dmgUpdatedAt || dmgCreatedAt;
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
