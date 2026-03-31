import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}


interface GitHubLatestRelease {
  tag_name: string;
  html_url: string;
  published_at?: string;
  created_at?: string;
  assets: GitHubReleaseAsset[];
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
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="preview-dialog-shell" role="dialog" aria-modal="true" aria-label="Screenshot preview">
      <button
        class="preview-dialog-close"
        type="button"
        aria-label="Close screenshot preview"
        (click)="close()"
      >
        ×
      </button>
      <img [src]="data.imageUrl" [alt]="data.altText">
      <div class="preview-dialog-hint">Press Esc or click outside to close</div>
    </div>
  `
})
export class PreviewDialogComponent {
  protected readonly data = inject<{ imageUrl: string; altText: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PreviewDialogComponent>);

  protected close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  protected latestVersion = 'Loading...';
  protected latestReleaseDate = 'Loading...';
  protected latestReleaseAge = 'Checking release age...';
  protected latestDmgUrl = 'https://github.com/senatov/MiMiNavigator/releases';
  protected readonly releasesPageUrl = 'https://github.com/senatov/MiMiNavigator/releases';
  protected readonly minimumMacOSVersion = 'macOS 26';
  protected readonly linkedInProfileUrl = 'https://www.linkedin.com/in/iakov-senatov-07060765/';

  protected readonly featureList = [
    {
      title: 'Dual-panel workflow',
      text: 'Browse, compare and manage files in two panels with a clearer, more practical workflow than Finder.'
    },
    {
      title: 'Tabs, history and favorites',
      text: 'Keep important locations close, switch between tabs quickly and move through file history without losing context.'
    },
    {
      title: 'FTP and SFTP access',
      text: 'Work with local and remote files in one interface instead of jumping between separate tools and windows.'
    }
  ];

  protected readonly detailList = [
    'Dual-panel file browsing designed for practical macOS work',
    'Tabs, favorites and navigation history kept within easy reach',
    'FTP and SFTP support for working with remote files',
    'A cleaner Finder alternative for people who move files all day'
  ];


  ngOnInit(): void {
    void this.loadLatestRelease();
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


  protected openPreview(imageName: string, windowName: string): void {
    void windowName;

    this.trackEvent('screenshot_open', {
      image: imageName
    });

    this.dialog.open(PreviewDialogComponent, {
      data: {
        imageUrl: `images/${imageName}`,
        altText: `Preview for ${imageName}`
      },
      maxWidth: '92vw',
      maxHeight: '92vh',
      panelClass: 'preview-dialog-panel',
      backdropClass: 'preview-dialog-backdrop',
      autoFocus: false,
      restoreFocus: true,
    });
  }


  private trackEvent(name: AnalyticsEventName, params: Record<string, unknown> = {}): void {
    window.gtag?.('event', name, params);
  }


  private async loadLatestRelease(): Promise<void> {
    const apiUrl = 'https://api.github.com/repos/senatov/MiMiNavigator/releases/latest';

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github+json'
        }
      });

      if (!response.ok) {
        this.latestVersion = 'Latest release';
        this.latestDmgUrl = this.releasesPageUrl;
        this.latestReleaseDate = 'Unknown release date';
        this.latestReleaseAge = 'Age unavailable';
        this.cdr.markForCheck();
        return;
      }

      const release = (await response.json()) as GitHubLatestRelease;
      const dmgAsset = release.assets.find(asset => asset.name.toLowerCase().endsWith('.dmg'));
      const releaseDate = release.published_at || release.created_at;

      this.latestVersion = release.tag_name || 'Latest release';
      this.latestDmgUrl = dmgAsset?.browser_download_url || release.html_url || this.releasesPageUrl;

      if (releaseDate) {
        this.latestReleaseDate = this.formatReleaseDate(releaseDate);
        this.latestReleaseAge = this.formatReleaseAge(releaseDate);
      } else {
        this.latestReleaseDate = 'Unknown release date';
        this.latestReleaseAge = 'Age unavailable';
      }
      this.cdr.markForCheck();
    } catch {
      this.latestVersion = 'Latest release';
      this.latestDmgUrl = this.releasesPageUrl;
      this.latestReleaseDate = 'Unknown release date';
      this.latestReleaseAge = 'Age unavailable';
      this.cdr.markForCheck();
    }
  }


  private formatReleaseDate(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown release date';
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }


  private formatReleaseAge(isoDate: string): string {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return 'Age unavailable';
    }

    const diffMs = Date.now() - date.getTime();

    if (diffMs < 0) {
      return 'Just released';
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor(diffMs / dayMs);

    if (days === 0) {
      return 'Released today';
    }

    if (days === 1) {
      return '1 day ago';
    }

    if (days < 30) {
      return `${days} days ago`;
    }

    const months = Math.floor(days / 30);

    if (months === 1) {
      return '1 month ago';
    }

    if (months < 12) {
      return `${months} months ago`;
    }

    const years = Math.floor(months / 12);

    if (years === 1) {
      return '1 year ago';
    }

    return `${years} years ago`;
  }
}
