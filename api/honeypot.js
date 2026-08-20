//
//  honeypot.js
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Vercel serverless function for unknown endpoints. It returns a JSON 404
//  without confusing either portal product with the other one.
//

const PRODUCT_PAYLOAD = {
    name: 'MiMi software portal',
    tagline: 'Independent desktop applications by Iakov Senatov.',
    description: 'The requested path does not exist on the MiMiNavigator and MiMiTrends presentation portal.',
    website: 'https://miminavi.tech/',
    projects: {
        navigator: 'https://miminavi.tech/',
        trends: 'https://miminavi.tech/trends'
    }
};

function handler(req, res) {
    const requestedPath = getRequestedPath(req);
    const body = {
        ok: false,
        type: 'not-found',
        requestedPath,
        product: PRODUCT_PAYLOAD,
        note: 'No public page or API endpoint exists at this path.'
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.status(404).json(body);
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
