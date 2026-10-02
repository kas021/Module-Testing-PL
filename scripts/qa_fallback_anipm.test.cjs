'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const realSourceDir = path.join(root, 'sources', 'anipm-v1');
const qaSourceDir = path.join(root, 'sources', 'qa-fallback-anipm-v1');
const realZip = path.join(root, 'modules', 'AniPM-0.1.0-beta.4.zip');
const qaZip = path.join(root, 'modules', 'Fallback-Test-AniPM-1.0.0-beta.1.zip');
const baselineZip = path.join(root, 'modules', 'AniPM-0.1.0-beta.3.zip');

const readZip = (archive, entry) => execFileSync('unzip', ['-p', archive, entry]);
const readManifest = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8'));

function loadModule(source, calls) {
  const fixtureSeries = {
    id: 101,
    title: 'One Piece',
    synopsis: 'Fixture synopsis',
    poster: '/poster.jpg',
    studios: ['Toei'],
    status: 'RELEASING',
    year: 1999,
    episodes: [
      { number: 1, title: 'I\u2019m Luffy!', sub: true, dub: true },
      { number: 2, title: 'The Great Swordsman', sub: true, dub: false },
    ],
  };
  const context = {
    console: { log() {} },
    fetchv2: async (url) => {
      calls.push(String(url));
      let body;
      if (String(url).includes('/api/anime/search?')) {
        body = { items: [{ id: 101, title: 'One Piece', poster: '/poster.jpg' }] };
      } else if (String(url).includes('/api/anime/series/101?')) {
        body = fixtureSeries;
      } else {
        throw new Error(`Unexpected fixture request: ${url}`);
      }
      return { ok: true, status: 200, text: async () => JSON.stringify(body) };
    },
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(source, context, { filename: 'anipm/index.js' });
  return context;
}

test('beta.4 preserves beta.3 JavaScript byte-for-byte', () => {
  const source = fs.readFileSync(path.join(realSourceDir, 'index.js'));
  assert.deepEqual(source, readZip(baselineZip, 'index.js'));
  assert.deepEqual(readZip(realZip, 'index.js'), source);
});

test('QA module has an independent, TEST-only module identity', () => {
  const qa = readManifest(qaSourceDir);
  const real = readManifest(realSourceDir);
  assert.equal(qa.id, 'qa-fallback-anipm-v1');
  assert.equal(qa.moduleFamilyId, 'qa-fallback-anipm-v1');
  assert.equal(qa.moduleIdentityNumber, 997);
  assert.equal(qa.moduleIdentity, 'SP-VID-997-QA-FALLBACK-ANIPM');
  assert.notEqual(qa.id, real.id);
  assert.notEqual(qa.moduleFamilyId, real.moduleFamilyId);
  assert.equal(qa.presentation.recommended, false);
  assert.equal(qa.moduleStatus, 'trial');
  assert.match(qa.presentation.purpose, /Testing only/i);
  assert.match(qa.description, /no stream request/i);
});

test('both manifests declare matching absolute AniPM catalogue routes', () => {
  for (const manifest of [readManifest(realSourceDir), readManifest(qaSourceDir)]) {
    assert.deepEqual(JSON.parse(JSON.stringify(manifest.config.catalogueMapping)), {
      version: 1,
      routes: [{
        namespace: 'qa:anipm-catalogue-v1',
        seriesId: 'anipm:{id}',
        episodeId: 'anipm:{id}:e{episode}',
        numbering: 'absolute',
      }],
    });
  }
});

test('only QA module suggests the real AniPM source using manual identities', () => {
  const real = readManifest(realSourceDir);
  const qa = readManifest(qaSourceDir);
  assert.equal(Object.hasOwn(real.config, 'sourceFallbacks'), false);
  const qaGroup = qa.config.sourceFallbacks.groups[0];
  assert.equal(qaGroup.publisher, 'manual:qa-fallback-anipm-v1');
  assert.equal(qaGroup.source, 'qa-fallback-anipm-v1');
  assert.equal(qaGroup.primary.moduleId, 'qa-fallback-anipm-v1');
  assert.deepEqual(qaGroup.alternatives.map((choice) => [choice.publisher, choice.source, choice.moduleId]), [
    ['manual:anipm-v1', 'anipm-v1', 'anipm-v1'],
  ]);
  assert.doesNotMatch(JSON.stringify(qaGroup), /trusted:/);
});

for (const [label, dir, archive] of [
  ['AniPM beta.4', realSourceDir, realZip],
  ['Fallback Test (AniPM)', qaSourceDir, qaZip],
]) {
  test(`${label} package matches its source files`, () => {
    for (const name of ['module.json', 'index.js']) {
      assert.deepEqual(readZip(archive, name), fs.readFileSync(path.join(dir, name)));
    }
  });

  test(`${label} retains AniPM search, details and episode identity`, async () => {
    const calls = [];
    const module = loadModule(fs.readFileSync(path.join(dir, 'index.js'), 'utf8'), calls);
    const search = await module.searchResults('One Piece');
    assert.equal(search[0].href, 'anipm:101');
    assert.equal(search[0].id, '101');
    assert.equal((await module.extractDetails(search[0].href)).title, 'One Piece');
    const episodes = await module.extractEpisodes(search[0].href);
    assert.deepEqual(Array.from(episodes, (episode) => episode.href), [
      'anipm:101:e1', 'anipm:101:e2',
    ]);
    assert.deepEqual(Array.from(episodes, (episode) => episode.number), [1, 2]);
    assert.ok(calls.length >= 2);
  });
}

test('QA stream handler fails descriptively without issuing any stream request', async () => {
  const calls = [];
  const module = loadModule(
    fs.readFileSync(path.join(qaSourceDir, 'index.js'), 'utf8'), calls,
  );
  await assert.rejects(
    module.extractStreamUrl('anipm:101:e1', 'sub'),
    /QA fallback failure: stream resolution is deliberately disabled; no stream request was made\./,
  );
  assert.deepEqual(calls, []);
});
