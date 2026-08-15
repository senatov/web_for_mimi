import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation} from '@angular/core';

import {GitHubService, RecentCommitViewModel} from './github.service';
import {GitHubLatestRelease} from './github.models';

interface TrendsScreenshot {
    src: string;
    alt: string;
    title: string;
    description: string;
}

@Component({
    selector: 'app-trends-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trends-page.component.html',
    styleUrls: ['./styles/app.css', './styles/trends.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendsPageComponent implements OnInit {
    private readonly gitHubService = inject(GitHubService);
    private readonly cdr = inject(ChangeDetectorRef);

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
        }
    ];

    protected latestVersion = 'Latest release';
    protected latestReleaseDate = 'Checking GitHub…';
    protected latestDmgUrl = this.releasesUrl;
    protected recentCommits: RecentCommitViewModel[] = [];

    ngOnInit(): void {
        void Promise.all([this.loadRelease(), this.loadCommits()]);
    }

    protected trackCommit(_: number, commit: RecentCommitViewModel): string {
        return commit.hash;
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
}
