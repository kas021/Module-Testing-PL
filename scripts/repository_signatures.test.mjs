import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { signatureErrors } from './repository_signatures.mjs';

const load = () => JSON.parse(fs.readFileSync(new URL('../repository.json', import.meta.url)));
const community = (index) => signatureErrors(index, { allowCommunityIndex: true });
test('current TEST publication satisfies native provider signatures without changing source provenance', () => {
  assert.deepEqual(community(load()), []);
  assert.equal(load().signature, '');
  assert.equal(load().bundle.signature, '');
});
test('changing publication revision without re-signing rejects subtitle declarations', () => {
  const index = load();
  index.publishedAtMs++;
  assert.ok(community(index).some((e) => e.startsWith('subtitle provider:')));
});
test('a missing bundle signature is rejected despite a valid archive hash', () => {
  const index = load();
  index.bundle.signature = '';
  assert.ok(signatureErrors(index).some((e) => e.startsWith('bundle:')));
});
test('strict signed mode never accepts the community index as trusted', () => {
  const index = load();
  assert.ok(signatureErrors(index).some((e) => e.startsWith('repository index:')));
});
test('an endpoint change cannot inherit a valid subtitle signature', () => {
  const index = load();
  index.subtitleProviders[0].endpoint = 'https://untrusted.invalid/subtitles';
  assert.ok(community(index).length > 0);
});
test('malformed Base64 is rejected rather than silently normalized by Node', () => {
  const index = load();
  index.subtitleProviders[0].signature = `!${index.subtitleProviders[0].signature}`;
  assert.ok(community(index).some((e) => e.startsWith('subtitle provider:')));
});
test('community mode never accepts a stale nonempty index signature', () => {
  const index = load();
  index.signature = index.subtitleProviders[0].signature;
  assert.ok(community(index).some((e) => e.startsWith('repository index:')));
});
test('the public standalone provider descriptor matches the index revision', () => {
  const index = load();
  const descriptor = JSON.parse(fs.readFileSync(new URL('../subtitle-provider.json', import.meta.url)));
  assert.equal(descriptor.publishedAtMs, index.publishedAtMs);
  assert.equal(descriptor.repositoryId, index.repositoryId);
  assert.deepEqual(descriptor.provider, index.subtitleProviders[0]);
});
