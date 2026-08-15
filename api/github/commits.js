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

const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';
const PROJECT_REPOSITORIES = {
  navigator: 'senatov/MiMiNavigator',
  trends: 'senatov/mimiTrends'
};

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
  const commitsUrl = `https://api.github.com/repos/${repository}/commits?per_page=18`;

  const headers = {
    Accept: GITHUB_ACCEPT_HEADER,
    'User-Agent': 'web_for_mimi'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(commitsUrl, {
      headers
    });

    if (!response.ok) {
      const fallbackCommits = await loadFallbackCommits(headers, repository);

      if (fallbackCommits.length > 0) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.status(200).json(fallbackCommits);
        return;
      }

      const responseText = await response.text();
      res.setHeader('Cache-Control', 'no-store');
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

async function loadFallbackCommits(headers, repository) {
  const releaseResponse = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers
  });

  if (releaseResponse.ok) {
    const release = await releaseResponse.json();
    const compareUrl = extractCompareApiUrl(release.body, repository);

    if (compareUrl) {
      const compareResponse = await fetch(compareUrl, {
        headers
      });

      if (compareResponse.ok) {
        const comparePayload = await compareResponse.json();

        if (Array.isArray(comparePayload.commits)) {
          return mapCommits(comparePayload.commits.reverse()).slice(0, 18);
        }
      }
    }
  }

  const repositoryResponse = await fetch(`https://api.github.com/repos/${repository}`, { headers });
  if (!repositoryResponse.ok) {
    return [];
  }
  const repositoryPayload = await repositoryResponse.json();
  const branchResponse = await fetch(`https://api.github.com/repos/${repository}/branches/${repositoryPayload.default_branch}`, {
    headers
  });

  if (!branchResponse.ok) {
    return [];
  }

  const branch = await branchResponse.json();
  const commit = branch.commit;

  return commit ? mapCommits([commit]) : [];
}

function extractCompareApiUrl(body, repository) {
  if (!body) {
    return null;
  }

  const escapedRepository = repository.replace('/', '\\/');
  const match = body.match(new RegExp(`github\\.com\\/${escapedRepository}\\/compare\\/([^\\s)]+)`, 'i'));

  if (!match) {
    return null;
  }

  return `https://api.github.com/repos/${repository}/compare/${match[1]}`;
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
