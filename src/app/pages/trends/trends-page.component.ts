import {CommonModule} from '@angular/common';
import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {RouterLink} from '@angular/router';
import {SeoKeywordHighlightDirective} from '../../seo-keyword-highlight.directive';
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
    imports: [SeoKeywordHighlightDirective, CommonModule, RouterLink, MatDialogModule],
    templateUrl: './trends-page.component.html',
    styleUrls: ['../../styles/app.css', '../../styles/trends.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendsPageComponent implements OnInit, OnDestroy {
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
            src: '/images/trends/LiveRadar.png',
            alt: 'MiMiTrends compact Live radar showing rapid-crash alerts',
            title: 'Compact Live radar',
            description: 'See confirmed rapid crashes immediately in full-width yellow rows, together with movement, price, age, scan progress, and the active liquid pool.'
        }
    ];

    protected latestVersion = 'Latest release';
    protected latestReleaseDate = 'Checking GitHub…';
    protected latestReleaseAge = 'Checking release age...';
    protected latestDmgFileDate = 'Checking DMG file date...';
    protected latestDmgFileAge = '';
    protected latestDmgUrl = this.releasesUrl;
    protected recentCommits: RecentCommitViewModel[] = [];
    private latestReleaseIsoDate: string | null = null;
    private latestDmgIsoDate: string | null = null;
    private releaseAgeTimerId: number | null = null;

    ngOnInit(): void {
        this.applySeoMetadata();
        void Promise.all([this.loadRelease(), this.loadCommits()]);
    }

    ngOnDestroy(): void {
        if (this.releaseAgeTimerId !== null) {
            window.clearInterval(this.releaseAgeTimerId);
        }
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
            autoFocus: 'first-tabbable',
            restoreFocus: true
        });
    }

    private async loadRelease(): Promise<void> {
        const release = await this.gitHubService.loadLatestRelease('trends');
        if (release) {
            this.applyRelease(release);
        } else {
            this.latestReleaseDate = 'See GitHub for current builds';
            this.latestReleaseAge = 'Age unavailable';
            this.latestDmgFileDate = 'Unknown DMG file date';
        }
        this.cdr.markForCheck();
    }

    private applyRelease(release: GitHubLatestRelease): void {
        const dmg = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
        const releaseDate = release.published_at || release.created_at || null;
        const dmgDate = dmg?.updated_at || dmg?.created_at || releaseDate;
        this.latestVersion = release.tag_name || 'Latest release';
        this.latestDmgUrl = dmg?.browser_download_url || release.html_url || this.releasesUrl;
        this.latestReleaseIsoDate = releaseDate;
        this.latestDmgIsoDate = dmgDate;
        this.latestReleaseDate = releaseDate ? this.gitHubService.formatReleaseDate(releaseDate) : 'Unknown release date';
        this.latestDmgFileDate = dmgDate ? this.gitHubService.formatReleaseDate(dmgDate) : 'Unknown DMG file date';
        this.updateAges();
        if (this.releaseAgeTimerId !== null) {
            window.clearInterval(this.releaseAgeTimerId);
        }
        this.releaseAgeTimerId = window.setInterval(() => {
            this.updateAges();
            this.cdr.markForCheck();
        }, 60_000);
    }

    private updateAges(): void {
        this.latestReleaseAge = this.latestReleaseIsoDate
            ? this.gitHubService.formatReleaseAge(this.latestReleaseIsoDate)
            : 'Age unavailable';
        this.latestDmgFileAge = this.latestDmgIsoDate
            ? this.gitHubService.formatReleaseAge(this.latestDmgIsoDate).replace('Released ', 'Updated ')
            : '';
    }

    private async loadCommits(): Promise<void> {
        this.recentCommits = await this.gitHubService.loadRecentCommits('trends');
        this.cdr.markForCheck();
    }

    private applySeoMetadata(): void {
        const title = 'MiMiTrends — Local-First Corridor and Rapid-Crash Radar';
        const description = 'Local-first Kotlin and JavaFX desktop radar that rotates through liquid US and European equities, finds stable intraday corridors and sudden four-minute drops, and keeps market data on-device.';
        const imageUrl = 'https://miminavi.tech/images/trends/AppIcon-1024.png';
        const pageUrl = 'https://miminavi.tech/trends';

        this.document.title = title;
        this.setMeta('name', 'description', description);
        this.setMeta('name', 'application-name', 'MiMiTrends');
        this.setMeta('name', 'keywords', 'MiMiTrends, stock corridor scanner, rapid crash alert, intraday corridor detector, liquid stock scanner, US stock radar, European stock radar, four minute price drop, local-first stock scanner, Kotlin desktop app, JavaFX trading software, Yahoo OHLCV, optional Finnhub, SQLite market data');
        this.setMeta('property', 'og:site_name', 'MiMiTrends');
        this.setMeta('property', 'og:title', title);
        this.setMeta('property', 'og:description', description);
        this.setMeta('property', 'og:url', pageUrl);
        this.setMeta('property', 'og:image', imageUrl);
        this.setMeta('property', 'og:image:alt', 'MiMiTrends application icon');
        this.setMeta('property', 'og:image:width', '1024');
        this.setMeta('property', 'og:image:height', '1024');
        this.setMeta('property', 'og:image:type', 'image/png');
        this.setMeta('name', 'twitter:title', title);
        this.setMeta('name', 'twitter:description', description);
        this.setMeta('name', 'twitter:image', imageUrl);
        this.setMeta('name', 'twitter:image:alt', 'MiMiTrends application icon');

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
                'Stable two-hour intraday corridor detection',
                'Rapid-crash alerts for declines of at least 0.50% within four minutes',
                'Rotating coverage of up to 90 liquid US and European equities per regular cycle',
                'Independent one-minute priority checks for active rapid crashes',
                'Bounded public discovery of up to 20 candidates every 30 minutes',
                'Accepted US and European signal refresh through Scalable when an ISIN is known',
                'Exchange-aware market calendars and observation timestamps',
                'Focused local SQLite market history and accepted-event storage',
                'Local broker CSV transaction import',
                'JavaFX price charts with OHLCV and execution context'
            ]
        });
        this.document.head.appendChild(structuredData);
    }

    private setMeta(attribute: 'name' | 'property', key: string, content: string): void {
        const element = this.document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
        element?.setAttribute('content', content);
    }
}
