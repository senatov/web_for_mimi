import {CommonModule, DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {GitHubService, RecentCommitViewModel} from '../../github.service';
import {GitHubLatestRelease} from '../../github.models';
import {PreviewDialogComponent, PreviewDialogData} from '../../preview-dialog.component';

interface ProductScreenshot { src: string; alt: string; title: string; description: string; }
const pageUrl = 'https://miminavi.tech/mimitrendsios';
const repositoryUrl = 'https://github.com/senatov/mimiTrendsIOS';
const iconUrl = 'https://miminavi.tech/images/trends/AppIcon-1024.png';
const title = 'mimiTrendsIOS — SwiftUI market radar for iPad and Mac';
const description = 'A SwiftUI prototype for iPad and macOS 27+: market radar, source telemetry, saved signals and price charts. Download the notarized Mac DMG; iPad App Store release is in preparation.';

@Component({
    selector: 'app-trends-page',
    standalone: true,
    imports: [CommonModule, RouterLink, MatDialogModule],
    templateUrl: './trends-page.component.html',
    styleUrls: ['../../styles/app.css', '../../styles/trends/page.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendsPageComponent implements OnInit {
    private readonly gitHubService = inject(GitHubService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly document = inject(DOCUMENT);
    private readonly dialog = inject(MatDialog);
    protected readonly repositoryUrl = repositoryUrl;
    protected readonly releasesUrl = `${repositoryUrl}/releases`;
    protected readonly archiveUrl = 'https://github.com/senatov/mimiTrends';
    protected readonly linkedInUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';
    protected readonly screenshots: ProductScreenshot[] = [
        {src: '/images/trends/mimitrendsios-ipad-radar.png', alt: 'mimiTrendsIOS on iPad with source telemetry, live radar signals and an Oracle price chart', title: 'Radar on iPad', description: 'The current iPad build shows source status, saved signals and a selected price chart in one scrollable workspace.'},
        {src: '/images/trends/mimitrendsios-macos-settings.jpg', alt: 'mimiTrendsIOS Rapid moves settings in the current macOS app', title: 'Rapid moves on Mac', description: 'Adjust signal thresholds and time windows in the Mac build.'},
        {src: '/images/trends/mimitrendsios-macos-currency.jpg', alt: 'mimiTrendsIOS currency settings in the current macOS app', title: 'Display currency on Mac', description: 'Choose how market values are displayed in the current SwiftUI app.'}
    ];
    protected readonly heroScreenshot = this.screenshots[0];
    protected latestVersion = '0.0.1.2';
    protected latestReleaseDate = '3 November 2026';
    protected latestDmgUrl = 'https://github.com/senatov/mimiTrendsIOS/releases/tag/0.0.1.2';
    protected recentCommits: RecentCommitViewModel[] = [];

    ngOnInit(): void {
        this.applySeoMetadata();
        void Promise.all([this.loadRelease(), this.loadCommits()]);
    }

    protected trackCommit(_: number, commit: RecentCommitViewModel): string { return commit.hash; }

    protected openScreenshot(screenshot: ProductScreenshot): void {
        const data: PreviewDialogData = {imageUrl: screenshot.src, altText: screenshot.alt, title: screenshot.title, hint: 'Use Esc or the close control to return to the gallery'};
        this.dialog.open(PreviewDialogComponent, {
            data, width: 'min(1440px, 96vw)', height: 'min(920px, 94vh)',
            maxWidth: '96vw', maxHeight: '94vh', panelClass: 'preview-dialog-panel',
            backdropClass: 'preview-dialog-backdrop', autoFocus: 'first-tabbable', restoreFocus: true
        });
    }

    private async loadRelease(): Promise<void> {
        const release: GitHubLatestRelease | null = await this.gitHubService.loadLatestRelease('trendsios');
        if (release) {
            const dmg = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
            this.latestVersion = release.tag_name || this.latestVersion;
            this.latestDmgUrl = dmg?.browser_download_url || release.html_url || this.latestDmgUrl;
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
            softwareVersion: this.latestVersion, url: pageUrl, downloadUrl: this.latestDmgUrl,
            codeRepository: repositoryUrl, image: iconUrl,
            screenshot: this.screenshots.map(screenshot => `https://miminavi.tech${screenshot.src}`),
            programmingLanguage: 'Swift', description
        });
        this.document.head.appendChild(structuredData);
    }
}
