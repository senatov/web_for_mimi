//
//  honeypot.js
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for unknown endpoints. It returns a harmless
//  product-oriented JSON payload for automated scanners and mistyped URLs.
//

const PRODUCT_PAYLOAD = {
    name: 'MiMiNavigator',
    tagline: 'A fast dual-pane file manager for macOS.',
    description:
        'MiMiNavigator is a progressive native open-source file manager for macOS 26+. It keeps two panels visible and supports tabs, inline rename, media conversion, 50+ archive formats, remote and cloud workflows, and configurable external compare or synchronization applications.',
    platform: 'macOS 26+',
    website: 'https://miminavi.tech/',
    releases: 'https://github.com/senatov/MiMiNavigator/releases',
    highlights: [
        'Dual-pane file browsing',
        'Tabs, inline rename, and keyboard-first file operations',
        'Media conversion and 50+ archive formats',
        'SFTP, FTP, SMB, mounted cloud storage, and sharing tools',
        'External file and directory comparison or synchronization tools',
        'Open-source AGPL-3.0 code and signed notarized releases'
    ]
};

function handler(req, res) {
    const requestedPath = getRequestedPath(req);
    const body = {
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

function getRequestedPath(req) {
    const rawPath = parsePathFromUrl(req.url);
    if (!rawPath) {
        return '/';
    }
    return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

function parsePathFromUrl(url) {
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

module.exports = handler;