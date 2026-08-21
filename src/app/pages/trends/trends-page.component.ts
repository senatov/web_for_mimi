import {CommonModule} from '@angular/common';
import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GitHubLatestRelease} from '../../github.models';
import {PreviewDialogComponent, PreviewDialogData} from '../../preview-dialog.component';

interface TrendsScreenshot {
    src: string;
    alt: string;
    title: string;
    description: string;
}

@Component({
    selector: 'app-trends-page',
    standalone: true,
    imports: [CommonModule, RouterLink, MatDialogModule],
    templateUrl: './trends-page.component.html',
    styleUrls: ['../../styles/app.css', '../../styles/trends.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendsPageComponent implements OnInit {
    private readonly gitHubService = inject(GitHubService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly document = inject(DOCUMENT);
    private readonly dialog = inject(MatDialog);

    protected readonly repositoryUrl = 'https://github.com/senatov/mimiTrends';
    protected readonly releasesUrl = `${this.repositoryUrl}/releases`;
    protected readonly linkedInUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
    protected readonly isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    protected readonly screenshots: TrendsScreenshot[] = [
        {
            src: '/images/trends/MainWindow.png',
            alt: 'MiMiTrends anomaly scanner and signal chart',
            title: 'Scanner and signal chart',
            description: 'Rank fresh signals, inspect minute candles, volume, entry context, and imported executions in one workspace.'
        },
        {
            src: '/images/trends/ScannerSettings.png',
            alt: 'MiMiTrends scanner settings',
            title: 'Explainable scanner settings',
            description: 'Tune detection, trend, universe, provider, scheduling, and appearance controls with guidance beside every analytical field.'
        },
        {
            src: '/images/trends/BrokerCsvImport.png',
            alt: 'MiMiTrends broker CSV import',
            title: 'Local broker CSV import',
            description: 'Import Scalable Capital transactions locally and match executions to the corresponding chart without uploading portfolio data.'
        },
        {
            src: '/images/trends/MacOSPackaging.png',
            alt: 'MiMiTrends signed macOS application and DMG packaging output',
            title: 'Native macOS packaging',
            description: 'Build a versioned, Developer ID signed, notarized, and verified DMG with a private Java runtime.'
        }
    ];

    protected latestVersion = 'Latest release';
    protected latestReleaseDate = 'Checking GitHub…';
    protected latestDmgUrl = this.releasesUrl;
    protected recentCommits: RecentCommitViewModel[] = [];

    ngOnInit(): void {
        this.applySeoMetadata();
        void Promise.all([this.loadRelease(), this.loadCommits()]);
    }

    protected trackCommit(_: number, commit: RecentCommitViewModel): string {
        return commit.hash;
    }

    protected openScreenshot(screenshot: TrendsScreenshot): void {
        const data: PreviewDialogData = {
            imageUrl: screenshot.src,
            altText: screenshot.alt,
            title: screenshot.title,
            hint: 'Use Esc or the close control to return to the gallery'
        };

        this.dialog.open(PreviewDialogComponent, {
            data,
            width: 'min(1440px, 96vw)',
            height: 'min(920px, 94vh)',
            maxWidth: '96vw',
            maxHeight: '94vh',
            panelClass: 'preview-dialog-panel',
            backdropClass: 'preview-dialog-backdrop',
            autoFocus: false,
            restoreFocus: true
        });
    }

    private async loadRelease(): Promise<void> {
        const release = await this.gitHubService.loadLatestRelease('trends');
        if (release) {
            this.applyRelease(release);
        } else {
            this.latestReleaseDate = 'See GitHub for current builds';
        }
        this.cdr.markForCheck();
    }

    private applyRelease(release: GitHubLatestRelease): void {
        const dmg = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
        this.latestVersion = release.tag_name || 'Latest release';
        this.latestDmgUrl = dmg?.browser_download_url || release.html_url || this.releasesUrl;
        const date = release.published_at || release.created_at;
        this.latestReleaseDate = date ? this.gitHubService.formatReleaseDate(date) : 'Date unavailable';
    }

    private async loadCommits(): Promise<void> {
        this.recentCommits = await this.gitHubService.loadRecentCommits('trends');
        this.cdr.markForCheck();
    }

    private applySeoMetadata(): void {
        const title = 'MiMiTrends — Local-First Market Anomaly Scanner for US and European Stocks';
        const description = 'Local-first Kotlin and JavaFX stock scanner with performance-led discovery, fresh anomaly ranking, repeating short-cycle detection, and explainable US and European market analysis.';
        const imageUrl = 'https://miminavi.tech/images/trends/MainWindow.png';
        const pageUrl = 'https://miminavi.tech/trends';

        this.document.title = title;
        this.setMeta('name', 'description', description);
        this.setMeta('name', 'application-name', 'MiMiTrends');
        this.setMeta('name', 'keywords', 'MiMiTrends, market anomaly scanner, live stock leader discovery, stock performance scanner, most traded stocks, range-aware repeating price cycle detector, stock anomaly detector, unusual price movement, momentum scanner, US stock scanner, European stock scanner, Kotlin desktop app, JavaFX trading software, local-first market analysis, OHLCV scanner, volume anomaly, V-shaped reversal detector, SQLite and DuckDB market analytics');
        this.setMeta('property', 'og:site_name', 'MiMiTrends');
        this.setMeta('property', 'og:title', title);
        this.setMeta('property', 'og:description', description);
        this.setMeta('property', 'og:url', pageUrl);
        this.setMeta('property', 'og:image', imageUrl);
        this.setMeta('property', 'og:image:alt', 'MiMiTrends anomaly scanner and signal chart');
        this.setMeta('property', 'og:image:width', '1696');
        this.setMeta('property', 'og:image:height', '1263');
        this.setMeta('property', 'og:image:type', 'image/png');
        this.setMeta('name', 'twitter:title', title);
        this.setMeta('name', 'twitter:description', description);
        this.setMeta('name', 'twitter:image', imageUrl);
        this.setMeta('name', 'twitter:image:alt', 'MiMiTrends anomaly scanner and signal chart');

        const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        canonical?.setAttribute('href', pageUrl);
        const favicon = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        favicon?.setAttribute('href', '/images/trends/AppIcon-1024.png');

        this.document.querySelectorAll('script[type="application/ld+json"]').forEach(element => element.remove());
        const structuredData = this.document.createElement('script');
        structuredData.type = 'application/ld+json';
        structuredData.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'MiMiTrends',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'macOS, Windows, Linux',
            isAccessibleForFree: true,
            url: pageUrl,
            downloadUrl: this.releasesUrl,
            codeRepository: this.repositoryUrl,
            image: imageUrl,
            screenshot: this.screenshots.map(screenshot => `https://miminavi.tech${screenshot.src}`),
            programmingLanguage: 'Kotlin',
            description,
            featureList: [
                'Fresh US and European equity anomaly detection',
                'Performance-sorted discovery from bounded public leader pages',
                'Statistical detection of repeating two- and three-minute price cycles',
                'Adaptive ranking of impulses, reversals, and persistent trends',
                'Exchange-aware market calendars and observation timestamps',
                'Local SQLite market history and signal storage',
                'Local broker CSV transaction import',
                'JavaFX signal charts with OHLCV and execution context'
            ]
        });
        this.document.head.appendChild(structuredData);
    }

    private setMeta(attribute: 'name' | 'property', key: string, content: string): void {
        const element = this.document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
        element?.setAttribute('content', content);
    }
}
