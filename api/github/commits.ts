//
//  commits.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for loading recent MiMiNavigator commits
//  from GitHub using a server-side token.
//

// Minimal Node.js environment declaration for Vercel server runtime.
declare const process: {
  env: {
    GITHUB_TOKEN?: string;
  };
};

// Minimal request/response declarations for Vercel Node runtime.
interface VercelLikeRequest {
  method?: string;
}

interface VercelLikeResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

interface GitHubCommitApiItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      date?: string;
    };
  };
}

interface CommitViewModel {
  hash: string;
  shortHash: string;
  url: string;
  message: string;
  time: string;
}

const GITHUB_COMMITS_URL = 'https://api.github.com/repos/senatov/MiMiNavigator/commits?per_page=18';
const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    res.status(500).json({ error: 'Missing GITHUB_TOKEN environment variable' });
    return;
  }

  try {
    const response = await fetch(GITHUB_COMMITS_URL, {
      headers: {
        Accept: GITHUB_ACCEPT_HEADER,
        Authorization: `Bearer ${token}`,
        'User-Agent': 'web_for_mimi'
      }
    });

    if (!response.ok) {
      const responseText = await response.text();
      res.status(response.status).json({
        error: 'GitHub commits request failed',
        status: response.status,
        details: responseText
      });
      return;
    }

    const payload = (await response.json()) as unknown;

    if (!Array.isArray(payload)) {
      res.status(502).json({ error: 'Unexpected GitHub commits response format' });
      return;
    }

    const commits = mapCommits(payload as GitHubCommitApiItem[]);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(commits);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Unable to load commits', details: message });
  }
}

function mapCommits(commits: GitHubCommitApiItem[]): CommitViewModel[] {
  return commits
    .filter(commit => Boolean(commit.sha && commit.html_url && commit.commit?.message))
    .map(commit => ({
      hash: commit.sha,
      shortHash: commit.sha.slice(0, 8),
      url: commit.html_url,
      message: commit.commit.message.replace(/\s+/g, ' ').trim(),
      time: formatCommitTime(commit.commit.author?.date)
    }));
}

function formatCommitTime(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
