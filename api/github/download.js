//
//  download.js
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Resolves a GitHub release asset through the server-side token and redirects
//  clients to GitHub's short-lived signed storage URL without proxying the file.
//

const GITHUB_ACCEPT_HEADER = 'application/octet-stream';
const ASSET_ID_PATTERN = /^\d+$/;

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const assetID = typeof req.query.asset_id === 'string' ? req.query.asset_id : '';
  if (!ASSET_ID_PATTERN.test(assetID)) {
    res.status(400).json({ error: 'Invalid asset_id' });
    return;
  }
  if (!process.env.GITHUB_TOKEN) {
    res.status(503).json({ error: 'Download service is not configured' });
    return;
  }
  const headers = {
    Accept: GITHUB_ACCEPT_HEADER,
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'web_for_mimi'
  };
  try {
    const response = await fetch(
      `https://api.github.com/repos/senatov/MiMiNavigator/releases/assets/${assetID}`,
      { headers, redirect: 'manual' }
    );
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.redirect(302, location);
      return;
    }
    const responseText = await response.text();
    res.status(response.status).json({
      error: 'GitHub release asset request failed',
      status: response.status,
      details: responseText
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.status(500).json({ error: 'Unable to resolve release asset', details: message });
  }
}

module.exports = handler;
