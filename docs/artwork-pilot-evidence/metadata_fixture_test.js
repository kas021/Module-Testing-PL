'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const runner = require('/Users/khubaibshakh/Desktop/Synthetiq Player/MODULE_TESTER/lib/module_runner.js');

const root = '/Volumes/ZX20/BuildCaches/player-artwork-pilot-20261002';
const homeFixture = JSON.parse(fs.readFileSync(`${root}/evidence/home.json`, 'utf8'));
const detailFixture = JSON.parse(fs.readFileSync(`${root}/evidence/details.json`, 'utf8'));
const homeMedia = homeFixture.data.Page.media;
const detailMedia = detailFixture.data.Media;

function createFns(sourcePath, fixtureQueue) {
  let source;
  if (sourcePath.endsWith('.zip')) {
    const loaded = runner.loadModule(sourcePath);
    const validation = runner.validateManifest(loaded.manifest);
    assert.equal(validation.issues.some((issue) => !issue.ok), false);
    assert.equal(loaded.manifest.moduleVersion, '1.0.3-beta.7');
    source = loaded.jsCode;
  } else {
    source = fs.readFileSync(sourcePath, 'utf8');
  }
  const fns = runner.createModuleContext(source, false, {
    compat: 'flutter-fetchv2',
  });
  fns._context.fetchv2 = async () => ({
    status: 200,
    body: JSON.stringify(fixtureQueue.shift()),
    headers: {},
  });
  for (const name of [
    'searchResults',
    'extractDetails',
    'extractEpisodes',
    'extractStreamUrl',
  ]) {
    assert.equal(typeof fns[name], 'function', `${name} export is present`);
  }
  return fns;
}

async function collect(sourcePath) {
  const fns = createFns(sourcePath, [homeFixture, detailFixture]);
  const cards = await fns.searchResults('');
  const details = await fns.extractDetails(cards[0].id);
  return { cards, details };
}

async function main() {
  const baseline = await collect(`${root}/baseline/index.js`);
  const candidate = await collect(`${root}/Synthetiq-Flux-1.0.3-beta.7.zip`);

  assert.equal(candidate.cards.length, 4);
  assert.equal(candidate.details.anilistId, detailMedia.id);
  assert.equal(candidate.cards[0].backdrop, homeMedia[0].bannerImage);
  assert.equal(candidate.cards[0].backdropUrl, homeMedia[0].bannerImage);
  assert.equal(candidate.cards[0].tags.join(','), homeMedia[0].genres.join(','));
  assert.ok(candidate.cards[0].description.length > 0);
  assert.equal(candidate.details.backdrop, detailMedia.bannerImage);
  assert.equal(candidate.details.backdropUrl, detailMedia.bannerImage);
  assert.equal(candidate.details.tags.join(','), detailMedia.genres.join(','));
  assert.equal(candidate.details.description, baseline.details.description);

  const unchangedCardFields = [
    'id', 'href', 'url', 'title', 'image', 'poster', 'type', 'anilistId',
    'malId', 'year', 'episodes', 'score', 'format',
  ];
  for (let index = 0; index < baseline.cards.length; index++) {
    for (const field of unchangedCardFields) {
      assert.equal(
        JSON.stringify(candidate.cards[index][field]),
        JSON.stringify(baseline.cards[index][field]),
      );
    }
  }
  const unchangedDetailFields = [
    'id', 'href', 'title', 'name', 'image', 'poster', 'synopsis', 'genres',
    'year', 'status', 'format', 'episodes', 'duration', 'score', 'anilistId',
    'malId',
  ];
  for (const field of unchangedDetailFields) {
    assert.equal(
      JSON.stringify(candidate.details[field]),
      JSON.stringify(baseline.details[field]),
    );
  }

  const noMetadata = JSON.parse(JSON.stringify(homeFixture));
  delete noMetadata.data.Page.media[0].bannerImage;
  delete noMetadata.data.Page.media[0].description;
  delete noMetadata.data.Page.media[0].genres;
  const missingFns = createFns(`${root}/Synthetiq-Flux-1.0.3-beta.7.zip`, [noMetadata]);
  const missingCard = (await missingFns.searchResults(''))[0];
  assert.equal(missingCard.backdrop, '');
  assert.equal(missingCard.backdropUrl, '');
  assert.equal(missingCard.description, '');
  assert.equal(JSON.stringify(missingCard.tags), '[]');

  const noDetailMetadata = JSON.parse(JSON.stringify(detailFixture));
  noDetailMetadata.data.Media.bannerImage = null;
  noDetailMetadata.data.Media.description = null;
  noDetailMetadata.data.Media.genres = null;
  const missingDetailsFns = createFns(
    `${root}/Synthetiq-Flux-1.0.3-beta.7.zip`,
    [noDetailMetadata],
  );
  const missingDetails = await missingDetailsFns.extractDetails('sadirect:a210482');
  assert.equal(missingDetails.backdrop, '');
  assert.equal(missingDetails.backdropUrl, '');
  assert.equal(missingDetails.description, '');
  assert.equal(JSON.stringify(missingDetails.tags), '[]');

  console.log(JSON.stringify({
    currentHomeCards: candidate.cards.length,
    checkedDetailsId: candidate.details.anilistId,
    metadataFields: ['backdrop', 'backdropUrl', 'description', 'tags'],
    legacyIdentityAndImageFieldsUnchanged: true,
    metadataAbsenceIsSafeForHomeAndDetails: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
