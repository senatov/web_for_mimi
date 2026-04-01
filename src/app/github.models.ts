//
//  github.models.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  GitHub API model types used by the MiMiNavigator landing page.
//

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface GitHubLatestRelease {
  tag_name?: string;
  name?: string;
  html_url?: string;
  published_at?: string;
  created_at?: string;
  assets: GitHubReleaseAsset[];
}

export interface GitHubCommitItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      date?: string;
    };
  };
}
