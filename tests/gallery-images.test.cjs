const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function pngSize(relativePath) {
    const file = fs.openSync(path.join(root, 'public', 'images', relativePath), 'r');
    try {
        const header = Buffer.alloc(24);
        assert.equal(fs.readSync(file, header, 0, header.length, 0), header.length, relativePath);
        assert.equal(header.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', relativePath);
        assert.equal(header.subarray(12, 16).toString(), 'IHDR', relativePath);
        return [header.readUInt32BE(16), header.readUInt32BE(20)];
    } finally {
        fs.closeSync(file);
    }
}

function checkImages(images) {
    assert.ok(images.length > 0, 'gallery must contain screenshots');
    const seen = new Set();
    for (const [file, width, height] of images) {
        assert.ok(!seen.has(file), `duplicate gallery image: ${file}`);
        seen.add(file);
        assert.deepEqual(pngSize(file), [Number(width), Number(height)], file);
    }
}

test('Navigator gallery dimensions match the PNG files', () => {
    const source = fs.readFileSync(path.join(root, 'src/app/pages/navigator/navigator-page.component.ts'), 'utf8');
    const images = [...source.matchAll(/\['(navigator\/gallery\/\d+\.png)',\s*'[^']+',\s*(\d+),\s*(\d+)\]/g)]
        .map(([, file, width, height]) => [file, width, height]);
    checkImages(images);
    const galleryFiles = fs.readdirSync(path.join(root, 'public/images/navigator/gallery'))
        .filter(file => /^\d+\.png$/.test(file) && file !== '000.png')
        .map(file => `navigator/gallery/${file}`).sort();
    assert.deepEqual(images.map(([file]) => file).sort(), galleryFiles, 'all published Navigator screenshots appear in the gallery');
});

test('static screenshot metadata and guide dimensions match their PNG files', () => {
    const index = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
    const image = index.match(/<meta property="og:image" content="https:\/\/miminavi\.tech\/images\/([^"]+)">/);
    const width = index.match(/<meta property="og:image:width" content="(\d+)">/);
    const height = index.match(/<meta property="og:image:height" content="(\d+)">/);
    assert.ok(image && width && height, 'homepage image metadata is present');
    assert.deepEqual(pngSize(image[1]), [Number(width[1]), Number(height[1])]);

    const guide = fs.readFileSync(path.join(root, 'public/share-link/index.html'), 'utf8');
    const screenshot = guide.match(/<img src="\/images\/([^"]+\.png)" alt="[^"]+" width="(\d+)" height="(\d+)"/);
    assert.ok(screenshot, 'Share+Link guide screenshot is present');
    assert.deepEqual(pngSize(screenshot[1]), [Number(screenshot[2]), Number(screenshot[3])]);
});

test('mimiTrends gallery includes every numbered PNG in order and uses its actual dimensions', () => {
    const screenshots = require('../src/app/pages/trends/trends-screenshots.json');
    const images = screenshots.map(({src, width, height}) => [src.replace('/images/', ''), width, height]);
    checkImages(images);

    const galleryFiles = fs.readdirSync(path.join(root, 'public/images/trends'))
        .filter(file => /^\d+\.png$/.test(file))
        .sort();
    assert.deepEqual(images.map(([file]) => file), galleryFiles.map(file => `trends/${file}`));
    assert.deepEqual(galleryFiles, galleryFiles.map((_, index) => `${String(index + 1).padStart(3, '0')}.png`));
});
