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

const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';
const PROJECT_REPOSITORIES = {
  navigator: 'senatov/MiMiNavigator',
  trends: 'senatov/mimiTrends'
};
const LAST_MACOS_26_RELEASE = 'v0.9.1.2';

function minimumNavigatorMacOS(tagName) {
  const parts = tagName.replace(/^v/, '').split('.').map(Number);
  const lastCompatible = [0, 9, 1, 2];
  if (parts.length !== 4 || !parts.every(Number.isInteger)) {
    return 26;
  }
  const firstDifference = parts.findIndex((part, index) => part !== lastCompatible[index]);
  return firstDifference >= 0 && parts[firstDifference] > lastCompatible[firstDifference] ? 27 : 26;
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const project = typeof req.query.project === 'string' ? req.query.project : 'navigator';
  const repository = PROJECT_REPOSITORIES[project];
  if (!repository) {
    res.status(400).json({ error: 'Unknown project' });
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
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
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

    let release = await response.json();
    if (project === 'navigator' && minimumNavigatorMacOS(release.tag_name) > 26) {
      const requestedMacOS = Number(req.query.macos);
      const isCurrentClient = req.query.channel === 'latest';
      if (!isCurrentClient || (req.query.macos !== undefined && (!Number.isInteger(requestedMacOS) || requestedMacOS < 27))) {
        const compatibleResponse = await fetch(`https://api.github.com/repos/${repository}/releases/tags/${LAST_MACOS_26_RELEASE}`, {headers});
        if (!compatibleResponse.ok) {
          res.status(503).json({error: 'Compatible macOS 26 release is unavailable'});
          return;
        }
        release = await compatibleResponse.json();
      }
    }
    const assets = Array.isArray(release.assets) ? release.assets : [];
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({ ...release, assets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Unable to load latest release', details: message });
  }
}

module.exports = handler;
