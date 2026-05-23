//
//  release.js
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for loading the latest MiMiNavigator release
//  from GitHub. Keeps the landing page off direct browser GitHub API calls.
//

const GITHUB_LATEST_RELEASE_URL = 'https://api.github.com/repos/senatov/MiMiNavigator/releases/latest';
const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const headers = {
    Accept: GITHUB_ACCEPT_HEADER,
    'User-Agent': 'web_for_mimi'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Unable to load latest release', details: message });
  }
}

module.exports = handler;
