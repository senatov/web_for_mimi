//
//  release.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for loading the latest MiMiNavigator release
//  from GitHub. Keeps the landing page off direct browser GitHub API calls.
//

// Minimal Node.js environment declaration for Vercel server runtime.
declare const process: {
  env: {
    GITHUB_TOKEN?: string;
  };
};

interface VercelLikeRequest {
  method?: string;
}

interface VercelLikeResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

const GITHUB_LATEST_RELEASE_URL = 'https://api.github.com/repos/senatov/MiMiNavigator/releases/latest';
const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';

async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: GITHUB_ACCEPT_HEADER,
    'User-Agent': 'web_for_mimi'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      headers
    });

    if (!response.ok) {
      const responseText = await response.text();
      res.status(response.status).json({
        error: 'GitHub latest release request failed',
        status: response.status,
        details: responseText
      });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(await response.json());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Unable to load latest release', details: message });
  }
}

export default handler;
