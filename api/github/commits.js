//
//  commits.js
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for loading recent MiMiNavigator commits
//  from GitHub using an optional server-side token.
//

const GITHUB_COMMITS_URL = 'https://api.github.com/repos/senatov/MiMiNavigator/commits?per_page=18';
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
    const response = await fetch(GITHUB_COMMITS_URL, {
      headers
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

    const payload = await response.json();

    if (!Array.isArray(payload)) {
      res.status(502).json({ error: 'Unexpected GitHub commits response format' });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(mapCommits(payload));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Unable to load commits', details: message });
  }
}

function mapCommits(commits) {
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

function formatCommitTime(value) {
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

module.exports = handler;
