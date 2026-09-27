'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, 'index.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const anchor = '  globalThis.__sadTrace = function () {';
assert.ok(source.includes(anchor), 'module diagnostic hook exists');
const instrumented = source.replace(anchor,
  '  globalThis.__trioTest = { readBody: readBody, validateHls: validateHls, buildCandidate: buildCandidate, packStream: packStream, setFrontier: function(fn) { verifyFrontier = fn; }, rescueCaptions: rescueCaptions };\n' + anchor);

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

const playlist = '#EXTM3U\n#EXTINF:6,\nsegment.png\n#EXT-X-ENDLIST';

for (const state of ['unavailable', 'unverified', 'throws', 'timeout']) {
  test('aired episodes remain discoverable when primary is ' + state, async () => {
    const context = loadModule(async () => ({status: 200,
      json: {data: {Media: {id: 21, idMal: 21, episodes: 1200,
        nextAiringEpisode: {episode: 1179}}}}}));
    const sessions = [];
    context.setTimeout = (fn, ms) => setTimeout(fn, Math.min(ms, 20));
    context.__trioTest.setFrontier(async (_ref, _total, _audio, session) => {
      sessions.push(session);
      if (state === 'throws') throw Error('provider unavailable');
      if (state === 'timeout') return new Promise(() => {});
      return {frontier: 0, state, probes: 1};
    });
    const episodes = await context.extractEpisodes('sadirect:a21');
    assert.equal(episodes.length, 1178);
    assert.equal(episodes.at(-1).number, 1178);
    assert.equal(episodes[0].subAvailable, true);
    assert.equal(episodes[0].dubAvailable, true);
    assert.ok(sessions.every(session => session.closed));
  });
}

test('verified audio windows remain distinct and metadata absence stays empty', async () => {
  const context = loadModule(async () => ({status: 200,
    json: {data: {Media: {id: 21, episodes: 12}}}}));
  context.__trioTest.setFrontier(async (_ref, _total, audio) =>
    ({state: 'verified', frontier: audio === 'sub' ? 12 : 3, firstAvailable: 1}));
  const episodes = await context.extractEpisodes('sadirect:a21');
  assert.equal(episodes.length, 12);
  assert.equal(episodes[3].subAvailable, true);
  assert.equal(episodes[3].dubAvailable, false);
  const empty = loadModule(async () => ({status: 200, json: {data: {Media: {}}}}));
  assert.equal((await empty.extractEpisodes('sadirect:a21')).length, 0);
});

test('rescue captions retain multiple translations without mixing audio edits', () => {
  const context = loadModule();
  const tracks = context.__trioTest.rescueCaptions({
    sub: [
      {file: 'https://example.com/en.vtt', label: 'English', lang: 'en'},
      {file: 'https://example.com/es.vtt', label: 'Spanish', lang: 'en'},
      {file: 'https://example.com/fr.vtt', label: 'French', lang: 'en'},
    ],
    dub: [{file: 'https://example.com/dub.vtt', label: 'English'}],
  }, 'sub', {});
  assert.deepEqual(plain(tracks.map(track => track.language)), ['en', 'es', 'fr']);
});

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
  const result = await context.__trioTest.validateHls(
    'https://media.example/master.m3u8', {}, { closed: false, deadline: Date.now() + 5000 }, {});
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'png_ts');
  assert.equal(result.requiresHlsNormalization, true);
});

test('media segment probe requests the bounded 4 MiB bridge cap', async () => {
  const calls = [];
  const context = loadModule(async (url, headers, method, body, options) => {
    calls.push({ url, options });
    return url.endsWith('master.m3u8')
      ? { status: 200, body: playlist }
      : { status: 200, body: 'G' + '\u0000'.repeat(187 * 3), contentType: 'image/jpeg' };
  });
  const result = await context.__trioTest.validateHls(
    'https://media.example/master.m3u8', {}, { closed: false, deadline: Date.now() + 5000 }, {});
  const segmentCall = calls.find((call) => call.url.endsWith('segment.png'));
  assert.equal(segmentCall.options.maxBytesHint, 4 * 1024 * 1024);
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'ts');
});

test('PNG-looking bytes without native evidence and dropped bodies are rejected', async () => {
  for (const segment of [
    { status: 200, body: '\ufffdPNG\r\n\u001a\nplaceholder', bodyBytes: 1200, contentType: 'image/png' },
    { status: 200, body: '', bodyBytes: 2102064, bodyDropped: true, contentType: 'image/jpeg' },
  ]) {
    const context = loadModule(async (url) => url.endsWith('master.m3u8')
      ? { status: 200, body: playlist }
      : segment);
    const result = await context.__trioTest.validateHls(
      'https://media.example/master.m3u8', {}, { closed: false, deadline: Date.now() + 5000 }, {});
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
  const result = await context.__trioTest.buildCandidate(
    { anilistId: 123, malId: 456 },
    1,
    'dub',
    { id: 'flow', label: 'Flow', ticket: 'fixture-ticket' },
    { closed: false, deadline: Date.now() + 5000 },
  );
  assert.equal(result, null);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\/api\/play\?/);
});
