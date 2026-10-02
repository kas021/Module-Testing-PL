'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const evidence = JSON.parse(fs.readFileSync(
  path.join(root, 'docs', 'anikoto-anipm-10-title-evidence.json'), 'utf8',
));
const modules = {
  anikoto: {
    id: 'anikoto-v4',
    family: 'anikoto-v3',
    sourceDir: path.join(root, 'sources', 'anikoto-v4'),
    candidateZip: path.join(root, 'modules', 'Anikoto-5.0.5-beta.3.zip'),
    baselineZip: path.join(root, 'modules', 'Anikoto-5.0.5-beta.2.zip'),
    version: '5.0.5-beta.3',
  },
  anipm: {
    id: 'anipm-v1',
    family: 'anipm-v1',
    sourceDir: path.join(root, 'sources', 'anipm-v1'),
    candidateZip: path.join(root, 'modules', 'AniPM-0.1.0-beta.5.zip'),
    baselineZip: path.join(root, 'modules', 'AniPM-0.1.0-beta.3.zip'),
    version: '0.1.0-beta.5',
  },
  qa: {
    id: 'qa-fallback-anipm-v1',
    sourceDir: path.join(root, 'sources', 'qa-fallback-anipm-v1'),
  },
};

const zipRead = (archive, entry) => execFileSync('unzip', ['-p', archive, entry]);
const sourceManifest = (name) => JSON.parse(fs.readFileSync(
  path.join(modules[name].sourceDir, 'module.json'), 'utf8',
));
const removeCandidateMetadata = (manifest) => {
  const copy = JSON.parse(JSON.stringify(manifest));
  delete copy.moduleVersion;
  delete copy.version;
  delete copy.config.catalogueMapping;
  delete copy.config.sourceFallbacks;
  return copy;
};

for (const name of ['anikoto', 'anipm']) {
  const spec = modules[name];
  test(`${spec.id} package matches source and preserves prior playback bytes`, () => {
    const manifest = sourceManifest(name);
    assert.equal(manifest.id, spec.id);
    assert.equal(manifest.moduleFamilyId, spec.family);
    assert.equal(manifest.moduleVersion, spec.version);
    assert.deepEqual(zipRead(spec.candidateZip, 'module.json'),
      fs.readFileSync(path.join(spec.sourceDir, 'module.json')));
    assert.deepEqual(zipRead(spec.candidateZip, 'index.js'),
      fs.readFileSync(path.join(spec.sourceDir, 'index.js')));
    assert.deepEqual(zipRead(spec.candidateZip, 'index.js'),
      zipRead(spec.baselineZip, 'index.js'));
    assert.deepEqual(removeCandidateMetadata(manifest),
      removeCandidateMetadata(JSON.parse(zipRead(spec.baselineZip, 'module.json'))));
  });
}

test('both real modules declare exact v2 anipm numeric-key routes', () => {
  const koto = sourceManifest('anikoto').config.catalogueMapping;
  const pm = sourceManifest('anipm').config.catalogueMapping;
  assert.equal(koto.version, 2);
  assert.equal(pm.version, 2);
  const kotoRoute = koto.routes.find((route) => route.namespace === 'anipm:anime');
  const pmRoute = pm.routes.find((route) => route.namespace === 'anipm:anime');
  assert.deepEqual(kotoRoute, {
    namespace: 'anipm:anime',
    seriesId: '{slug}',
    episodeId: '{id}|{slug}|{episode}',
    numbering: 'absolute',
  });
  assert.equal(Object.hasOwn(kotoRoute, 'lookupId'), false);
  assert.deepEqual(pmRoute, {
    namespace: 'anipm:anime',
    seriesId: 'anipm:{id}',
    episodeId: 'anipm:{id}:e{episode}',
    numbering: 'absolute',
  });
  assert.equal(Object.hasOwn(pmRoute, 'lookupId'), false);
});

test('AniPM v2 retains the v1 QA namespace route without suggesting QA as fallback', () => {
  const pm = sourceManifest('anipm').config;
  const qa = sourceManifest('qa').config;
  const legacyRoute = pm.catalogueMapping.routes.find(
    (route) => route.namespace === 'qa:anipm-catalogue-v1',
  );
  assert.deepEqual(legacyRoute, {
    namespace: 'qa:anipm-catalogue-v1',
    seriesId: 'anipm:{id}',
    episodeId: 'anipm:{id}:e{episode}',
    numbering: 'absolute',
  });
  assert.equal(qa.catalogueMapping.version, 1);
  assert.equal(qa.catalogueMapping.routes[0].namespace, legacyRoute.namespace);
  assert.equal(pm.sourceFallbacks.groups.length, 1);
  assert.equal(pm.sourceFallbacks.groups[0].alternatives[0].moduleId, 'anikoto-v4');
  assert.equal(sourceManifest('anikoto').config.sourceFallbacks.groups.length, 1);
  for (const config of [sourceManifest('anikoto').config, pm]) {
    assert.ok(!JSON.stringify(config.sourceFallbacks).includes('qa-fallback-anipm-v1'));
    assert.ok(!JSON.stringify(config.sourceFallbacks).includes('trusted:'));
  }
  assert.equal(qa.sourceFallbacks.groups[0].alternatives[0].moduleId, 'anipm-v1');
});

test('fixed live audit supports 10/10 numeric-key and episode-count title pairs', () => {
  assert.equal(evidence.denominator.predeclaredTitles, 10);
  assert.equal(evidence.denominator.singleExactCandidateBothModules, 10);
  assert.equal(evidence.denominator.exactDetailsAndEpisodeListBothModules, 10);
  assert.equal(evidence.denominator.sameNumericCatalogueId, 10);
  assert.equal(evidence.denominator.sameEpisodeCount, 10);
  assert.equal(evidence.denominator.sampledEpisodeIdPairs, 30);
  assert.equal(evidence.cases.length, 10);
  assert.equal(evidence.cases.reduce((sum, item) => sum + item.anikotoEpisodes, 0), 2526);

  for (const item of evidence.cases) {
    assert.equal(item.anikotoEpisodes, item.anipmEpisodes, item.title);
    for (const sample of item.sampleEpisodes) {
      assert.equal(sample.anikotoId,
        `${item.id}|${item.anikotoSlug}|${sample.number}`, item.title);
      assert.equal(sample.anipmId, `anipm:${item.id}:e${sample.number}`, item.title);
    }
  }
  assert.match(evidence.languageEvidence.tenTitleEpisodeAudioFlags, /not preserved/);
  assert.deepEqual(evidence.languageEvidence.onePieceEpisode101.anikoto,
    evidence.languageEvidence.onePieceEpisode101.anipm);
});

test('template rendering retains native module IDs and absolute episode numbers', () => {
  const routes = [
    {
      series: '{slug}', episode: '{id}|{slug}|{episode}',
      nativeSeries: (_id, slug) => slug,
      nativeEpisode: (id, slug, ep) => `${id}|${slug}|${ep}`,
    },
    {
      series: 'anipm:{id}', episode: 'anipm:{id}:e{episode}',
      nativeSeries: (id) => `anipm:${id}`,
      nativeEpisode: (id, _slug, ep) => `anipm:${id}:e${ep}`,
    },
  ];
  for (const item of evidence.cases) {
    for (const route of routes) {
      assert.equal(route.nativeSeries(item.id, item.anikotoSlug),
        route.series.replace('{id}', String(item.id)).replace('{slug}', item.anikotoSlug));
      for (const sample of item.sampleEpisodes) {
        const number = sample.number;
        assert.equal(route.nativeEpisode(item.id, item.anikotoSlug, number),
          route.episode.replace('{id}', String(item.id))
            .replace('{slug}', item.anikotoSlug).replace('{episode}', String(number)));
      }
    }
  }
});
