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
});

test('mimiTrends gallery and PhotoSwipe dimensions match the PNG files', () => {
    const source = fs.readFileSync(path.join(root, 'src/app/pages/trends/trends-page.component.ts'), 'utf8');
    const images = [...source.matchAll(/src:\s*'\/images\/(trends\/[^']+\.png)',[\s\S]*?width:\s*(\d+),\s*height:\s*(\d+)/g)]
        .map(([, file, width, height]) => [file, width, height]);
    checkImages(images);
});
