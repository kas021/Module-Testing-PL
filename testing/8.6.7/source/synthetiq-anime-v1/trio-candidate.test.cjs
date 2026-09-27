'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, 'index.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const anchor = '  globalThis.searchResults = searchResults;';
assert.ok(source.includes(anchor), 'module export block exists');
const instrumented = source.replace(anchor,
  '  globalThis.__trioTest = { readBody: readBody, probeHls: probeHls, playVidhawkTicket: playVidhawkTicket, packStream: packStream };\n' + anchor);

function unrefTimeout(callback, ms) {
  const timer = setTimeout(callback, ms);
  if (timer && typeof timer.unref === 'function') timer.unref();
  return timer;
}

function loadModule(fetchv2) {
  const context = vm.createContext({
    fetchv2,
    console: { log() {}, error() {} },
    setTimeout: unrefTimeout,
    clearTimeout,
  });
  vm.runInContext(instrumented, context, { filename: sourcePath });
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const playlist = '#EXTM3U\n#EXTINF:6,\nsegment.ts\n#EXT-X-ENDLIST';

test('async and object response.json take precedence over body', async () => {
  const context = loadModule();
  let textCalls = 0;
  const asyncValue = await context.__trioTest.readBody({
    json: async () => ({ result: 'parsed' }),
    body: 'wrong body',
    text: async () => { textCalls += 1; return 'wrong text'; },
  });
  const objectValue = await context.__trioTest.readBody({ json: { result: 'object' }, body: 'wrong body' });
  assert.equal(asyncValue, '{"result":"parsed"}');
  assert.equal(objectValue, '{"result":"object"}');
  assert.equal(textCalls, 0);
});

test('native exact PNG-wrapped TS marker validates and requests normalization', async () => {
  const context = loadModule(async (url) => url.endsWith('master.m3u8')
    ? { status: 200, body: playlist }
    : {
        status: 200,
        body: '\ufffdPNG\r\n\u001a\n' + 'x'.repeat(1200),
        bodyBytes: 1192,
        bodyDropped: false,
        contentType: 'image/png',
        hlsPrefixBytes: 252,
      });
  const result = await context.__trioTest.probeHls(
    'https://media.example/master.m3u8', {}, { closed: false, deadline: Date.now() + 5000 });
  assert.equal(result.ok, true);
  assert.equal(result.requiresHlsNormalization, true);
});

test('media segment probe requests the bounded 4 MiB bridge cap', async () => {
  const calls = [];
  const context = loadModule(async (url, headers, method, body, options) => {
    calls.push({ url, options });
    return url.endsWith('master.m3u8')
      ? { status: 200, body: playlist }
      : { status: 200, body: 'G' + '\u0000'.repeat(4095), contentType: 'image/jpeg' };
  });
  const result = await context.__trioTest.probeHls(
    'https://media.example/master.m3u8', {}, { closed: false, deadline: Date.now() + 5000 });
  const segmentCall = calls.find((call) => call.url.endsWith('segment.ts'));
  assert.equal(segmentCall.options.maxBytesHint, 4 * 1024 * 1024);
  assert.equal(result.ok, true);
});

test('PNG-looking bytes without native evidence and dropped bodies are rejected', async () => {
  for (const segment of [
    { status: 200, body: '\ufffdPNG\r\n\u001a\nplaceholder', bodyBytes: 1200, contentType: 'image/png' },
    { status: 200, body: '', bodyBytes: 2102064, bodyDropped: true, contentType: 'image/jpeg' },
  ]) {
    const context = loadModule(async (url) => url.endsWith('master.m3u8')
      ? { status: 200, body: playlist }
      : segment);
    const result = await context.__trioTest.probeHls(
      'https://media.example/master.m3u8', {}, { closed: false, deadline: Date.now() + 5000 });
    assert.equal(result.ok, false);
  }
});

test('packed server metadata retains each route flag and its own headers', () => {
  const context = loadModule();
  const primaryHeaders = { Referer: 'https://one.example/' };
  const backupHeaders = { Referer: 'https://two.example/' };
  const payload = plain(context.__trioTest.packStream(
    { url: 'https://one.example/master.m3u8', headers: primaryHeaders, requiresHlsNormalization: true },
    [{ url: 'https://two.example/master.m3u8', headers: backupHeaders, requiresHlsNormalization: false }],
    'sub',
  ));
  assert.equal(payload.requiresHlsNormalization, true);
  assert.equal(payload.servers[0].requiresHlsNormalization, true);
  assert.equal(payload.servers[1].requiresHlsNormalization, false);
  assert.deepEqual(payload.servers[0].headers, primaryHeaders);
  assert.deepEqual(payload.servers[1].headers, backupHeaders);
});

test('a missing requested Vidhawk language is not replaced by the other track', async () => {
  const calls = [];
  const context = loadModule(async (url) => {
    calls.push(url);
    return { status: 200, json: { tracks: [{ id: 'sub', src: 'https://media.example/sub.m3u8' }] } };
  });
  const result = await context.__trioTest.playVidhawkTicket(
    'fixture-ticket', 'dub', 'Flow', { closed: false, deadline: Date.now() + 5000 },
    'https://vidhawk.buzz/embed/ani/123/1/dub');
  assert.equal(result, null);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\/api\/play\?/);
});
