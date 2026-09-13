const siteUrl = (process.env.SITE_URL || 'https://miminavi.tech').replace(/\/$/, '');
const key = '0371f8c975dfdf028e5e4e63ac5aecf2';
const urls = [`${siteUrl}/`, `${siteUrl}/trends`];

const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {'Content-Type': 'application/json; charset=utf-8'},
    body: JSON.stringify({
        host: new URL(siteUrl).host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList: urls
    })
});

if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow returned ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urls.length} updated URLs (${response.status}).`);
