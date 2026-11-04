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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {PreviewDialogComponent, PreviewDialogData} from '../../preview-dialog.component';
import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GalleriaModule} from 'primeng/galleria';
import {PopoverModule} from 'primeng/popover';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {RouterLink} from '@angular/router';
import {SeoKeywordHighlightDirective} from '../../seo-keyword-highlight.directive';
import {PageMetadataService} from '../../page-metadata.service';
import {navigatorMinimumMacOS} from '../../navigator-platform';



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
        imports: [SeoKeywordHighlightDirective, CommonModule, MatDialogModule, GalleriaModule, PopoverModule, CardModule, DividerModule, TagModule, TooltipModule, RouterLink],
        templateUrl: './navigator-page.component.html',
        styleUrls: ['../../styles/app.css', '../../styles/navigator/prime.css', '../../styles/navigator/gallery.css'],
        changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigatorPageComponent implements OnInit, OnDestroy {
        private readonly dialog = inject(MatDialog);
        private readonly cdr = inject(ChangeDetectorRef);
        private readonly gitHubService = inject(GitHubService);
        private readonly pageMetadata = inject(PageMetadataService);
        @ViewChild('heroThumbnails') private heroThumbnails?: ElementRef<HTMLDivElement>;

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
        private readonly heroGalleryImageSpecs: Array<readonly [string, number, number]> = [
                ['navigator/gallery/dual-panel-workspace.png', 1353, 1258],
                ['navigator/gallery/advanced-file-search.png', 967, 900],
                ['navigator/gallery/media-converter-video.png', 1109, 852],
                ['navigator/gallery/server-connections.png', 817, 587],
                ['navigator/gallery/authorized-folders-dialog.png', 1046, 448],
                ['navigator/gallery/cloud-share-settings.png', 1054, 876],
                ['navigator/gallery/external-tools-diagnostics.png', 1156, 836],
                ['navigator/gallery/permissions-settings.png', 1156, 836],
                ['navigator/gallery/diff-tool-details.png', 1156, 836],
                ['navigator/gallery/panel-settings.png', 1156, 836],
                ['navigator/gallery/saved-server-editor.png', 1133, 718],
                ['navigator/gallery/diff-tool-settings.png', 1156, 836],
                ['navigator/gallery/path-completion.png', 1353, 1258],
                ['navigator/gallery/connections-menu.png', 1353, 1258],
                ['navigator/gallery/server-passwords.png', 1156, 836],
                ['navigator/gallery/column-presets.png', 1353, 1258],
                ['navigator/gallery/cloud-share-menu.png', 1353, 1258],
                ['navigator/gallery/sidebar-and-favorites.png', 1353, 1258],
                ['navigator/gallery/file-preview-panel.png', 1353, 1258],
                ['navigator/gallery/media-converter-gif.png', 1109, 852]
        ];
        private readonly heroCarouselTransitionMs = 920;
        private homebrewCopyTimerId: number | null = null;
        private latestReleaseIsoDate: string | null = null;
        private latestDmgIsoDate: string | null = null;
        private releaseAgeTimerId: number | null = null;
        private heroCarouselTransitionTimerId: number | null = null;

        protected recentCommits: RecentCommitViewModel[] = [];
        protected releaseNoteSections: ReleaseNoteSection[] = [];
        protected heroGalleryVisible = false;
        protected heroGalleryActiveIndex = 0;
        protected heroCarouselIndex = 0;
        protected previousHeroCarouselIndex = 0;
        protected heroCarouselTransitioning = false;
        protected homebrewCopied = false;
        protected homebrewCopyStatus = '';
        protected readonly galleryResponsiveOptions = [
                {breakpoint: '900px', numVisible: 4},
                {breakpoint: '600px', numVisible: 2}
        ];
        protected readonly heroGalleryImages: GalleryImageItem[] = this.buildHeroGalleryImages();
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



        ngOnDestroy(): void {
                this.stopReleaseAgeTimer();
                this.stopHeroCarouselTransition();
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
                if (index < 0 || index >= this.heroGalleryImages.length || index === this.heroCarouselIndex) {
                        return;
                }

                this.stopHeroCarouselTransition();

                this.previousHeroCarouselIndex = this.heroCarouselIndex;
                this.heroCarouselIndex = index;
                this.heroGalleryActiveIndex = index;
                this.heroCarouselTransitioning = true;
                this.cdr.markForCheck();
                this.scrollActiveThumbnailIntoView(index);

                this.heroCarouselTransitionTimerId = window.setTimeout(() => {
                        this.heroCarouselTransitioning = false;
                        this.previousHeroCarouselIndex = this.heroCarouselIndex;
                        this.heroCarouselTransitionTimerId = null;
                        this.cdr.markForCheck();
                }, this.heroCarouselTransitionMs);
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



        protected getHeroGalleryThumbnailLabel(index: number): string {
                return `Show ${this.heroGalleryImages[index].title}, screenshot ${index + 1} of ${this.heroGalleryImages.length}`;
        }



        protected trackHeroGalleryImage(_: number, image: GalleryImageItem): string {
                return image.itemImageSrc;
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



        protected onHeroThumbnailKeydown(event: KeyboardEvent, index: number): void {
                if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.selectHeroGalleryImage(index);
                }
        }



        protected onHeroGalleryVisibleChange(visible: boolean): void {
                this.heroGalleryVisible = visible;

                if (!visible) {
                        this.heroCarouselIndex = this.heroGalleryActiveIndex;
                        this.previousHeroCarouselIndex = this.heroGalleryActiveIndex;
                        this.heroCarouselTransitioning = false;
                }

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



        private stopHeroCarouselTransition(): void {
                if (this.heroCarouselTransitionTimerId !== null) {
                        window.clearTimeout(this.heroCarouselTransitionTimerId);
                        this.heroCarouselTransitionTimerId = null;
                }

                this.heroCarouselTransitioning = false;
        }



        private stopHomebrewCopyTimer(): void {
                if (this.homebrewCopyTimerId === null) {
                        return;
                }
                window.clearTimeout(this.homebrewCopyTimerId);
                this.homebrewCopyTimerId = null;
        }



        private buildHeroGalleryImages(): GalleryImageItem[] {
                return this.heroGalleryImageSpecs.map(([relativePath, width, height]) => {
                        return this.createGalleryImageItem(
                            relativePath,
                            this.createHeroGalleryImageTitle(relativePath),
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



        private scrollActiveThumbnailIntoView(index: number): void {
                const strip = this.heroThumbnails?.nativeElement;
                const thumbnail = strip?.children.item(index) as HTMLElement | null;
                if (!strip || !thumbnail) return;
                const left = thumbnail.offsetLeft - strip.offsetLeft - (strip.clientWidth - thumbnail.clientWidth) / 2;
                const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                strip.scrollTo({left, behavior: reducedMotion ? 'instant' : 'smooth'});
        }



        private createHeroGalleryImageTitle(relativePath: string): string {
                const fileName = relativePath.split('/').pop() ?? relativePath;
                const title = fileName
                        .replace(/\.[^.]+$/, '')
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                return `MiMiNavigator ${title}`;
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
