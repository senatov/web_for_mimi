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

import { Injectable } from '@angular/core';
import { isDevMode } from '@angular/core';

import { GitHubLatestRelease } from './github.models';

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
  private readonly requestHeaders: HeadersInit = {
    Accept: 'application/vnd.github+json'
  };
  private readonly millisecondsPerDay = 1000 * 60 * 60 * 24;
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
    try {
      const response = await fetch(this.recentCommitsUrl);

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
      return 'Unknown release date';
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  formatReleaseAge(isoDate: string): string {
    const publishedDate = this.parseDate(isoDate);

    if (!publishedDate) {
      return 'Age unavailable';
    }

    const currentDate = new Date();
    const diffInMilliseconds = currentDate.getTime() - publishedDate.getTime();

    if (diffInMilliseconds < 0) {
      return 'Released today';
    }

    const diffInDays = Math.floor(diffInMilliseconds / this.millisecondsPerDay);

    if (diffInDays <= 0) {
      return 'Released today';
    }

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
