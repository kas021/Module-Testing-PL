'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, 'index.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const instrumented = source + [
  '',
  'globalThis.__trioTest = {',
  '  readResponsePayload: readResponsePayload,',
  '  validateHlsPlayback: validateHlsPlayback,',
  '  extractStreamFromServer: extractStreamFromServer,',
  '  fallbackPlaybackResult: fallbackPlaybackResult,',
  '  setPlayerSources: function (value) { fetchPlayerSources = async function () { return value; }; },',
  '};',
].join('\n');

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

function streamFixtures(segment, onSegmentOptions) {
  return async function (url) {
    if (url.includes('/ajax/server?get=')) {
      return { status: 200, json: { status: 200, result: { url: 'https://player.example/sub/embed' } } };
    }
    if (url.endsWith('master.m3u8')) {
      return { status: 200, body: playlist, contentType: 'application/vnd.apple.mpegurl' };
    }
    if (onSegmentOptions) onSegmentOptions(arguments[4]);
    return segment;
  };
}

test('async and object response.json take precedence over body', async () => {
  const context = loadModule();
  let textCalls = 0;
  const asyncValue = await context.__trioTest.readResponsePayload({
    json: async () => ({ result: 'parsed' }),
    body: 'wrong body',
    text: async () => { textCalls += 1; return 'wrong text'; },
  });
  const objectValue = await context.__trioTest.readResponsePayload({ json: { result: 'object' }, body: 'wrong body' });
  assert.deepEqual(plain(asyncValue.json), { result: 'parsed' });
  assert.deepEqual(plain(objectValue.json), { result: 'object' });
  assert.equal(textCalls, 0);
});

test('native exact PNG-wrapped TS marker validates and requests normalization', async () => {
  const context = loadModule(streamFixtures({
    status: 200,
    body: '\ufffdPNG\r\n\u001a\n' + 'x'.repeat(1200),
    bodyBytes: 1192,
    bodyDropped: false,
    contentType: 'image/png',
    hlsPrefixBytes: 252,
  }));
  const result = await context.__trioTest.validateHlsPlayback(
    'https://media.example/master.m3u8', {}, () => true);
  assert.equal(result.ok, true);
  assert.equal(result.mediaKind, 'png_ts');
  assert.equal(result.requiresHlsNormalization, true);
});

test('ignored-Range segment probes request a bounded 4 MiB body by default', async () => {
  let requestOptions;
  const context = loadModule(streamFixtures({
    status: 200,
    body: 'G' + 'x'.repeat(1199),
    bodyBytes: 1200,
    contentType: 'video/mp2t',
  }, (options) => { requestOptions = options; }));
  const result = await context.__trioTest.validateHlsPlayback(
    'https://media.example/master.m3u8', {}, { alive: () => true });
  assert.equal(result.ok, true);
  assert.equal(requestOptions.maxBytesHint, 4 * 1024 * 1024);
});

test('dropped, byte-capped, unmarked PNG and unknown segment bodies are rejected', async () => {
  const rejected = [
    { status: 200, body: '', bodyBytes: 4000000, bodyDropped: true, contentType: 'video/mp2t' },
    { status: 200, body: '\ufffdPNG\r\n\u001a\nplaceholder', bodyBytes: 1200, contentType: 'image/png', hlsPrefixBytes: 0 },
    { status: 200, body: 'unknown bytes'.repeat(100), bodyBytes: 1300, contentType: 'application/octet-stream' },
  ];
  for (const segment of rejected) {
    const context = loadModule(streamFixtures(segment));
    const result = await context.__trioTest.validateHlsPlayback(
      'https://media.example/master.m3u8', {}, () => true);
    assert.equal(result.ok, false);
  }
});

test('each server route keeps its normalization flag and its own headers', () => {
  const context = loadModule();
  const primaryHeaders = { Referer: 'https://one.example/' };
  const backupHeaders = { Referer: 'https://two.example/' };
  const payload = plain(context.__trioTest.fallbackPlaybackResult([
    { name: 'One', url: 'https://one.example/master.m3u8', headers: primaryHeaders,
      requiresHlsNormalization: true, qualities: [{ label: 'Auto', url: 'https://one.example/master.m3u8', headers: primaryHeaders,
        requiresHlsNormalization: true }] },
    { name: 'Two', url: 'https://two.example/master.m3u8', headers: backupHeaders,
      requiresHlsNormalization: false, qualities: [{ label: 'Auto', url: 'https://two.example/master.m3u8', headers: backupHeaders }] },
  ], 'sub'));
  assert.equal(payload.requiresHlsNormalization, true);
  assert.equal(payload.servers[0].requiresHlsNormalization, true);
  assert.equal(payload.streams[0].requiresHlsNormalization, true);
  assert.equal(payload.streams[1].requiresHlsNormalization, false);
  assert.deepEqual(payload.streams[0].headers, primaryHeaders);
  assert.deepEqual(payload.streams[1].headers, backupHeaders);
});

test('primary server metadata carries wrapper requirement and scoped headers', async () => {
  const context = loadModule(streamFixtures({
    status: 200,
    body: '\ufffdPNG\r\n\u001a\n' + 'x'.repeat(1200),
    bodyBytes: 1192,
    bodyDropped: false,
    contentType: 'image/png',
    hlsPrefixBytes: 252,
  }));
  context.__trioTest.setPlayerSources({
    streams: [{ url: 'https://media.example/master.m3u8', quality: 'Auto' }],
    playerOrigin: 'https://player.example',
    playerType: 'sub',
    subtitles: [],
  });
  const route = await context.__trioTest.extractStreamFromServer(
    'https://anikototv.to',
    'https://anikototv.to/watch/example',
    { name: 'MegaPlay', linkId: '17' },
    'sub',
    { alive: () => true, probeMemo: {} },
  );
  assert.equal(route.requiresHlsNormalization, true);
  assert.equal(route.streams[0].requiresHlsNormalization, true);
  assert.deepEqual(plain(route.streams[0].headers), {
    Referer: 'https://player.example/',
    Origin: 'https://player.example',
    'User-Agent': route.headers['User-Agent'],
    Accept: '*/*',
  });
});

test('an explicit Dub request does not accept a Sub player URL', async () => {
  const context = loadModule(streamFixtures({ status: 200, body: 'G'.repeat(1200) }));
  await assert.rejects(
    context.__trioTest.extractStreamFromServer(
      'https://anikototv.to',
      'https://anikototv.to/watch/example',
      { name: 'MegaPlay', linkId: '17' },
      'dub',
      { alive: () => true },
    ),
    /Player URL language mismatch/,
  );
});
