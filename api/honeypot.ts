//
//  honeypot.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for unknown endpoints. It returns a harmless
//  product-oriented JSON payload for automated scanners and mistyped URLs.
//

// Minimal CommonJS module declaration for Vercel Node runtime.
declare const module: {
  exports: unknown;
};

interface VercelLikeRequest {
  method?: string;
  url?: string;
  headers?: {
    host?: string;
  };
}

interface VercelLikeResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

interface ProductPayload {
  ok: boolean;
  type: string;
  requestedPath: string;
  product: {
    name: string;
    tagline: string;
    description: string;
    platform: string;
    website: string;
    releases: string;
    highlights: string[];
  };
  note: string;
}

const PRODUCT_PAYLOAD = {
  name: 'MiMiNavigator',
  tagline: 'A fast dual-pane file manager for macOS.',
  description:
    'MiMiNavigator is a free macOS file manager for people who move real files all day. It keeps two panels visible and supports fast navigation, copy, move, rename, preview, archive workflows, favorites, tabs, SFTP, and Google Drive link sharing.',
  platform: 'macOS 26+',
  website: 'https://miminavi.tech/',
  releases: 'https://github.com/senatov/MiMiNavigator/releases',
  highlights: [
    'Dual-pane file browsing',
    'Keyboard-first file operations',
    'Archive, preview, and sharing tools',
    'SFTP, tabs, favorites, and history'
  ]
};

function handler(req: VercelLikeRequest, res: VercelLikeResponse): void {
  const requestedPath = getRequestedPath(req);
  const body: ProductPayload = {
    ok: true,
    type: 'product-info',
    requestedPath,
    product: PRODUCT_PAYLOAD,
    note: 'This endpoint is not part of the public API. Here is product information instead.'
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.status(200).json(body);
}

module.exports = handler;

function getRequestedPath(req: VercelLikeRequest): string {
  const rawPath = parsePathFromUrl(req.url);

  if (!rawPath) {
    return '/';
  }

  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

function parsePathFromUrl(url?: string): string {
  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url, 'https://miminavi.tech');
    const pathFromQuery = parsedUrl.searchParams.get('path');

    return pathFromQuery || parsedUrl.pathname;
  } catch {
    return url.split('?')[0] || '';
  }
}
