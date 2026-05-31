//
//  app.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Root application component for the MiMiNavigator landing page.
//

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {PreviewDialogComponent, PreviewDialogData} from './preview-dialog.component';
import {GitHubService, RecentCommitViewModel} from './github.service';
import {GalleriaModule} from 'primeng/galleria';
import {PopoverModule} from 'primeng/popover';
import {SeoKeywordHighlightDirective} from './seo-keyword-highlight.directive';


interface GalleryImageItem {
    itemImageSrc: string;
    thumbnailImageSrc: string;
    alt: string;
    title: string;
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
    | 'linkedin_click'
    | 'releases_click'
    | 'screenshot_open';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, MatDialogModule, GalleriaModule, PopoverModule, SeoKeywordHighlightDirective],
    templateUrl: './app.html',
    styleUrl: './styles/app.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
    private readonly dialog = inject(MatDialog);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly gitHubService = inject(GitHubService);

    protected latestVersion = 'Loading...';
    protected latestReleaseDate = 'Loading...';
    protected latestReleaseAge = 'Checking release age...';
    protected latestReleaseHeadline = 'Latest release is loading...';
    protected latestReleaseSummary = 'Release details are loading from GitHub.';
    protected latestDmgFileDate = 'Checking DMG file date...';
    protected latestDmgFileAge = '';
    protected latestDmgUrl = 'https://github.com/senatov/MiMiNavigator/releases';
    protected readonly releasesPageUrl = 'https://github.com/senatov/MiMiNavigator/releases';
    protected readonly minimumMacOSVersion = 'macOS 26';
    protected readonly linkedInProfileUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
    private readonly previewImageBasePath = '/images';
    private readonly previewDialogHint = 'Press Esc or click outside to close';
    private readonly heroGalleryFolderPath = 'gallery';
    private readonly heroGalleryFileNames = [
        'Preview0.png',
        'Preview1.png',
        'g0.png',
        'g1.png',
        'g2.png',
        'g3.png',
        'g4.png',
        'g5.png',
        'g6.png',
        'g7.png',
        'g8.png',
        'g9.png'
    ];
    private readonly heroCarouselTransitionMs = 920;
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
    protected readonly heroGalleryImages: GalleryImageItem[] = this.buildHeroGalleryImages();
    protected readonly isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    protected readonly downloadPitchText = 'MiMiNavigator is a free dual-pane file manager for macOS built for people who move real files all day. It keeps source and destination visible, supports keyboard-first operations, remembers panel state, opens remote and archive locations, shares Google Drive links, and ships as a signed notarized DMG.';


    ngOnInit(): void {
        void Promise.all([
            this.loadLatestRelease(),
            this.loadRecentCommits()
        ]);
    }

    ngOnDestroy(): void {
        this.stopReleaseAgeTimer();
        this.stopHeroCarouselTransition();
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

    protected openHeroGallery(event?: Event): void {
        event?.preventDefault();
        this.heroGalleryActiveIndex = this.heroCarouselIndex;
        this.heroGalleryVisible = true;

        this.trackEvent('screenshot_open', {
            image: 'Preview3.png',
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
        return `Show screenshot ${index + 1} of ${this.heroGalleryImages.length}`;
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
            maxWidth: '92vw',
            maxHeight: '92vh',
            panelClass: 'preview-dialog-panel',
            backdropClass: 'preview-dialog-backdrop',
            autoFocus: false,
            restoreFocus: true,
        });
    }

    private stopHeroCarouselTransition(): void {
        if (this.heroCarouselTransitionTimerId !== null) {
            window.clearTimeout(this.heroCarouselTransitionTimerId);
            this.heroCarouselTransitionTimerId = null;
        }

        this.heroCarouselTransitioning = false;
    }

    private buildHeroGalleryImages(): GalleryImageItem[] {
        return this.heroGalleryFileNames.map(fileName => {
            return this.createGalleryImageItem(
                `${this.heroGalleryFolderPath}/${fileName}`,
                this.createHeroGalleryImageTitle(fileName)
            );
        });
    }

    private createGalleryImageItem(relativePath: string, alt: string): GalleryImageItem {
        const imageUrl = `${this.previewImageBasePath}/${relativePath}`;

        return {
            itemImageSrc: imageUrl,
            thumbnailImageSrc: imageUrl,
            alt,
            title: alt
        };
    }

    private createHeroGalleryImageTitle(fileName: string): string {
        const title = fileName.replace(/\.[^.]+$/, '').replace(/^g(\d+)$/i, 'Demo $1');

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
        this.latestReleaseHeadline = this.createReleaseHeadline(this.latestVersion);
        this.latestReleaseSummary = this.extractReleaseSummary(release.body);
        this.latestDmgUrl = dmgAsset?.browser_download_url || release.html_url || this.releasesPageUrl;
        this.releaseNoteSections = this.extractReleaseNoteSections(release.body);

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
        const sectionNames = new Set(['highlights', 'added', 'changed', 'fixed']);
        const sections: ReleaseNoteSection[] = [];
        let currentSection: ReleaseNoteSection | null = null;

        for (const rawLine of (body || '').split('\n')) {
            const headingMatch = rawLine.match(/^##\s+(.+?)\s*$/);

            if (headingMatch) {
                const title = headingMatch[1].trim();
                currentSection = sectionNames.has(title.toLowerCase()) ? {title, items: []} : null;

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
            return 'Release notes are loading from GitHub.';
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
                return `${formattedDmg} (release: ${formattedRelease})`;
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
            .replace('Released ', 'Built ');
    }

    private applyReleaseFallback(): void {
        this.latestReleaseIsoDate = null;
        this.latestDmgIsoDate = null;
        this.stopReleaseAgeTimer();
        this.latestVersion = 'Latest release';
        this.latestDmgUrl = this.releasesPageUrl;
        this.latestReleaseDate = 'Unknown release date';
        this.latestReleaseAge = 'Age unavailable';
        this.latestReleaseHeadline = 'Latest release';
        this.latestReleaseSummary = 'Release details are temporarily unavailable. Use the releases page for the current build.';
        this.latestDmgFileDate = 'Unknown DMG file date';
        this.latestDmgFileAge = '';
        this.releaseNoteSections = [];
        this.cdr.markForCheck();
    }
}
