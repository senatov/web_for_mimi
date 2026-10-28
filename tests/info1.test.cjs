const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const handler = require('../api/info1.js');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const table = period => `<div class="tabpane ${period}"><table class="t-data"><tbody>
  <tr><td>1.</td><td>Neu!</td><td><a href="/aktien/example-aktie">Example &amp; Co</a></td>
  <td>1.234,50</td><td>+2,25</td><td></td><td>-1,50</td><td>+3,75</td><td>+24,00</td></tr>
  <tr class="d-sm-none"><td colspan="12">Mobile details</td></tr>
</tbody></table></div>`;
const html = ['performance1d', 'performance7d', 'performance30d', 'performance365d'].map(table).join('');

function response() {
  const result = { headers: {} };
  return {
    result,
    setHeader(name, value) { result.headers[name] = value; },
    status(value) { result.status = value; return this; },
    json(value) { result.body = value; return this; }
  };
}

test('parses every ranking and German-formatted numbers', () => {
  const data = handler.parsePerformancePage(html);
  assert.deepEqual(Object.keys(data), ['1d', '7d', '30d', '1y']);
  assert.deepEqual(data['1d'][0], {
    rank: 1,
    name: 'Example & Co',
    url: 'https://www.wallstreet-online.de/aktien/example-aktie',
    isNew: true,
    price: 1234.5,
    performance1dPercent: 2.25,
    performance7dPercent: 3.75,
    performance30dPercent: -1.5,
    performance1yPercent: 24
  });
  assert.equal(data['1d'].length, 1);
});

test('generates fresh JSON on each GET request', async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return { ok: true, text: async () => html };
  };

  const first = response();
  const second = response();
  await handler({ method: 'GET' }, first);
  await handler({ method: 'GET' }, second);
  assert.equal(calls, 2);
  assert.equal(first.result.status, 200);
  assert.equal(first.result.headers['Cache-Control'], 'no-store');
  assert.equal(first.result.body.periods['1y'].length, 1);
  assert.ok(first.result.body.generatedAt);
});

test('rejects incomplete source pages instead of returning partial data', () => {
  assert.throws(() => handler.parsePerformancePage(table('performance1d')), /Missing source table: 7d/);
});
