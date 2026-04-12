//
//  github.service.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  GitHub API service for loading the latest MiMiNavigator release
//  and recent commit activity for the landing page.
//

import {Injectable, isDevMode} from '@angular/core';

import {GitHubLatestRelease} from './github.models';

export interface RecentCommitViewModel {
    hash: string;
    shortHash: string;
    url: string;
    message: string;
    time: string;
}

@Injectable({
    providedIn: 'root'
})
export class GitHubService {
    private readonly latestReleaseUrl = 'https://api.github.com/repos/senatov/MiMiNavigator/releases/latest';
    private readonly recentCommitsUrl = '/api/github/commits';
    private readonly localRecentCommitsUrl = 'assets/recent-commits.json';
    private readonly requestHeaders: HeadersInit = {
        Accept: 'application/vnd.github+json'
    };
    private readonly millisecondsPerDay = 1000 * 60 * 60 * 24;
    private readonly millisecondsPerHour = 1000 * 60 * 60;
    private readonly millisecondsPerMinute = 1000 * 60;
    private readonly daysPerMonth = 30;
    private readonly monthsPerYear = 12;

    async loadLatestRelease(): Promise<GitHubLatestRelease | null> {
        try {
            const response = await fetch(this.latestReleaseUrl, {
                headers: this.requestHeaders
            });

            if (!response.ok) {
                return null;
            }

            return (await response.json()) as GitHubLatestRelease;
        } catch {
            return null;
        }
    }

    async loadRecentCommits(): Promise<RecentCommitViewModel[]> {
        const commitsUrl = this.resolveRecentCommitsUrl();

        try {
            const response = await fetch(commitsUrl);

            if (!response.ok) {
                this.logRecentCommitsError(`Commits endpoint failed with status ${response.status}`);
                return [];
            }

            const payload = (await response.json()) as unknown;

            if (!Array.isArray(payload)) {
                this.logRecentCommitsError('Commits endpoint response is not an array');
                return [];
            }

            return payload as RecentCommitViewModel[];
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown commits loading error';
            this.logRecentCommitsError(message);
            return [];
        }
    }

    formatReleaseDate(isoDate: string): string {
        const date = this.parseDate(isoDate);
        if (!date) {
            return 'Unknown date';
        }
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date).replace(',', ' ·');
    }

    formatReleaseAge(isoDate: string): string {
        const publishedDate = this.parseDate(isoDate);

        if (!publishedDate) {
            return 'Age unavailable';
        }

        const currentDate = new Date();
        const diffInMilliseconds = currentDate.getTime() - publishedDate.getTime();

        if (diffInMilliseconds < 0) {
            return 'Released just now';
        }

        const diffInMinutes = Math.floor(diffInMilliseconds / this.millisecondsPerMinute);

        if (diffInMinutes <= 0) {
            return 'Released just now';
        }

        if (diffInMinutes === 1) {
            return 'Released 1 minute ago';
        }

        if (diffInMinutes < 60) {
            return `Released ${diffInMinutes} minutes ago`;
        }

        const diffInHours = Math.floor(diffInMilliseconds / this.millisecondsPerHour);

        if (diffInHours === 1) {
            return 'Released 1 hour ago';
        }

        if (diffInHours < 24) {
            return `Released ${diffInHours} hours ago`;
        }

        const diffInDays = Math.floor(diffInMilliseconds / this.millisecondsPerDay);

        if (diffInDays === 1) {
            return 'Released 1 day ago';
        }

        if (diffInDays < this.daysPerMonth) {
            return `Released ${diffInDays} days ago`;
        }

        const diffInMonths = Math.floor(diffInDays / this.daysPerMonth);

        if (diffInMonths === 1) {
            return 'Released 1 month ago';
        }

        if (diffInMonths < this.monthsPerYear) {
            return `Released ${diffInMonths} months ago`;
        }

        const diffInYears = Math.floor(diffInMonths / this.monthsPerYear);

        if (diffInYears === 1) {
            return 'Released 1 year ago';
        }

        return `Released ${diffInYears} years ago`;
    }

    private resolveRecentCommitsUrl(): string {
        if (typeof window === 'undefined') {
            return this.recentCommitsUrl;
        }

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocalhost ? this.localRecentCommitsUrl : this.recentCommitsUrl;
    }

    private logRecentCommitsError(message: string): void {
        if (!isDevMode()) {
            return;
        }

        console.error('[GitHubService] loadRecentCommits failed:', message);
    }

    private parseDate(value: string): Date | null {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }
}