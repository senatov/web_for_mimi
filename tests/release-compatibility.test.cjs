const assert = require('node:assert/strict');
const {afterEach, test} = require('node:test');
const releaseHandler = require('../api/github/release.js');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

async function requestRelease(query, latestTag = 'v0.9.1.3') {
  const requests = [];
  global.fetch = async url => {
    requests.push(url);
    return {
      ok: true,
      json: async () => ({tag_name: url.includes('/tags/') ? 'v0.9.1.2' : latestTag, assets: []})
    };
  };
  const result = {headers: {}};
  const response = {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  };
  await releaseHandler({method: 'GET', query}, response);
  return {result, requests};
}

test('legacy updater receives the final macOS 26 release', async () => {
  const {result, requests} = await requestRelease({});
  assert.equal(result.status, 200);
  assert.equal(result.body.tag_name, 'v0.9.1.2');
  assert.equal(requests.length, 2);
});

test('macOS 27 updater and website receive the latest release', async () => {
  const updater = await requestRelease({project: 'navigator', channel: 'latest', macos: '27'});
  assert.equal(updater.result.body.tag_name, 'v0.9.1.3');
  assert.equal(updater.requests.length, 1);
  const website = await requestRelease({project: 'navigator', channel: 'latest'});
  assert.equal(website.result.body.tag_name, 'v0.9.1.3');
});

test('an older macOS client is kept on the compatible release', async () => {
  const {result} = await requestRelease({project: 'navigator', channel: 'latest', macos: '26'});
  assert.equal(result.body.tag_name, 'v0.9.1.2');
});

test('current macOS 26 release remains available before the transition', async () => {
  const {result, requests} = await requestRelease({}, 'v0.9.1.2');
  assert.equal(result.body.tag_name, 'v0.9.1.2');
  assert.equal(requests.length, 1);
});

test('legacy updater fails closed when the compatible release is unavailable', async () => {
  global.fetch = async url => url.includes('/tags/')
    ? {ok: false}
    : {ok: true, json: async () => ({tag_name: 'v0.9.1.3', assets: []})};
  const result = {};
  const response = {
    setHeader() {},
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  };
  await releaseHandler({method: 'GET', query: {}}, response);
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'Compatible macOS 26 release is unavailable');
});
