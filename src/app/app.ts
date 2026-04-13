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
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {PreviewDialogComponent, PreviewDialogData} from './preview-dialog.component';
import {GitHubService, RecentCommitViewModel} from './github.service';
import {GalleriaModule} from 'primeng/galleria';


interface GalleryImageItem {
    itemImageSrc: string;
    thumbnailImageSrc: string;
    alt: string;
    title: string;
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
    imports: [MatDialogModule, GalleriaModule],
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
    protected latestDmgFileDate = 'Checking DMG file date...';
    protected latestDmgUrl = 'https://github.com/senatov/MiMiNavigator/releases';
    protected readonly releasesPageUrl = 'https://github.com/senatov/MiMiNavigator/releases';
    protected readonly minimumMacOSVersion = 'macOS 26';
    protected readonly linkedInProfileUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
    private readonly previewImageBasePath = 'images';
    private readonly previewDialogHint = 'Press Esc or click outside to close';
    private readonly heroGalleryFolderPath = 'gallery';
    private readonly heroGalleryFileNames = [
        'g1.png',
        'g2.png',
        'g3.png',
        'g4.png',
        'g5.png',
        'g6.png',
        'g7.png'
    ];
    private readonly heroCarouselIntervalMs = 2_500;
    private latestReleaseIsoDate: string | null = null;
    private releaseAgeTimerId: number | null = null;
    private heroCarouselTimerId: number | null = null;

    protected recentCommits: RecentCommitViewModel[] = [];
    protected heroGalleryVisible = false;
    protected heroGalleryActiveIndex = 0;
    protected heroCarouselIndex = 0;
    protected readonly heroGalleryImages: GalleryImageItem[] = this.buildHeroGalleryImages();
    protected readonly isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    protected readonly featureList = [
        {
            title: 'Two panels or go home',
            text: 'Finder gives you one panel and calls it a day. MiMiNavigator gives you two, side by side, like every file manager should.',
            image: null
        },
        {
            title: 'Tabs, history, favorites',
            text: 'Open ten directories, bookmark the important ones, hit Back like a browser. No more "where the hell was that folder".',
            image: null
        },
        {
            title: 'Right-click that actually works',
            text: 'Context menus with real actions — copy, move, rename, compress, open with — no digging through submenus or praying Finder cooperates.',
            image: 'RMenu01.png'
        }
    ];


    ngOnInit(): void {
        this.startHeroCarousel();

        void Promise.all([
            this.loadLatestRelease(),
            this.loadRecentCommits()
        ]);
    }

    ngOnDestroy(): void {
        this.stopReleaseAgeTimer();
        this.stopHeroCarousel();
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

    protected openHeroGallery(event: Event): void {
        event.preventDefault();
        this.heroGalleryActiveIndex = this.heroCarouselIndex;
        this.heroGalleryVisible = true;

        this.trackEvent('screenshot_open', {
            image: 'Preview3.png',
            gallerySize: this.heroGalleryImages.length
        });

        this.cdr.markForCheck();
    }

    protected onHeroGalleryActiveIndexChange(index: number): void {
        this.heroGalleryActiveIndex = index;
        this.heroCarouselIndex = index;
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

    private startHeroCarousel(): void {
        this.stopHeroCarousel();

        this.heroCarouselTimerId = window.setInterval(() => {
            if (this.heroGalleryVisible || this.heroGalleryImages.length <= 1) {
                return;
            }

            this.heroCarouselIndex = (this.heroCarouselIndex + 1) % this.heroGalleryImages.length;
            this.cdr.markForCheck();
        }, this.heroCarouselIntervalMs);
    }

    private stopHeroCarousel(): void {
        if (this.heroCarouselTimerId === null) {
            return;
        }

        window.clearInterval(this.heroCarouselTimerId);
        this.heroCarouselTimerId = null;
    }

    private buildHeroGalleryImages(): GalleryImageItem[] {
        const heroImage = this.createGalleryImageItem('Preview3.png', 'MiMiNavigator hero preview');
        const galleryImages = this.heroGalleryFileNames.map(fileName => {
            return this.createGalleryImageItem(`${this.heroGalleryFolderPath}/${fileName}`, `MiMiNavigator gallery preview ${fileName}`);
        });

        return [heroImage, ...galleryImages];
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
        this.latestDmgUrl = dmgAsset?.browser_download_url || release.html_url || this.releasesPageUrl;

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
        this.latestDmgFileDate = this.resolveDmgFileDate(releaseDate, dmgUpdatedAt, dmgCreatedAt);

        this.cdr.markForCheck();
    }

    private resolveDmgFileDate(
        releaseDate?: string | null,
        dmgUpdatedAt?: string | null,
        dmgCreatedAt?: string | null
    ): string {
        const dmgDate = dmgUpdatedAt || dmgCreatedAt || releaseDate;
        if (!dmgDate) {
            return 'Unknown DMG file date';
        }

        return this.gitHubService.formatReleaseDate(dmgDate);
    }

    private async loadRecentCommits(): Promise<void> {
        this.recentCommits = await this.gitHubService.loadRecentCommits();
        this.cdr.markForCheck();
    }

    private startReleaseAgeTimer(): void {
        this.stopReleaseAgeTimer();

        this.releaseAgeTimerId = window.setInterval(() => {
            this.updateReleaseAge();
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

    private applyReleaseFallback(): void {
        this.latestReleaseIsoDate = null;
        this.stopReleaseAgeTimer();
        this.latestVersion = 'Latest release';
        this.latestDmgUrl = this.releasesPageUrl;
        this.latestReleaseDate = 'Unknown release date';
        this.latestReleaseAge = 'Age unavailable';
        this.latestDmgFileDate = 'Unknown DMG file date';
        this.cdr.markForCheck();
    }
}