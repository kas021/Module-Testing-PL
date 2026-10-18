// Metadata-only repair of the TEST publication. No package or provider changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { testingKey, moduleMessage, signatureErrors } from './repository_signatures.mjs';
import { v9ImportFloor, v9CompatibilityErrors } from './v9_compatibility.mjs';

assert.deepEqual(process.argv.slice(2), ['--write'], 'Use --write for local TEST metadata only.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const original = new Map(['repository.json', 'catalogue.json', 'SHA256SUMS'].map(name => [name, read(name)]));
const index = JSON.parse(original.get('repository.json'));
const catalogue = JSON.parse(original.get('catalogue.json'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(index.repositoryId, 'module-testing-pl');
assert.equal(catalogue.repositoryId, index.repositoryId);
assert.equal(index.schemaVersion, 1);
assert.equal(index.signature, '');
assert.equal(index.bundle.signature, '');
assert.deepEqual(signatureErrors(index, { allowCommunityIndex: true }), []);

// Verify every referenced executable byte before editing only admission metadata.
for (const entry of [index.bundle, ...index.modules]) {
  const url = new URL(entry.packageUrl);
  const prefix = '/kas021/Module-Testing-PL/main/';
  assert.equal(url.origin, 'https://raw.githubusercontent.com');
  assert.equal(url.pathname, entry.packagePath);
  assert.ok(url.pathname.startsWith(prefix) && !url.search && !url.hash);
  const file = fs.realpathSync(path.join(root, decodeURIComponent(url.pathname.slice(prefix.length))));
  assert.ok(file.startsWith(root + path.sep));
  assert.equal(hash(fs.readFileSync(file)), entry.sha256);
}
const keyPath = path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
assert.equal(fs.statSync(keyPath).mode & 0o077, 0);
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const publicKey = createPublicKey(key);
const publicJwk = publicKey.export({ format: 'jwk' });
assert.equal(publicJwk.x, testingKey.x);
assert.equal(publicJwk.y, testingKey.y);

let changed = 0;
for (const entry of index.modules) {
  if (/^9\.\d+\.\d+$/.test(entry.minAppVersion) && entry.minAppVersion !== v9ImportFloor) {
    entry.minAppVersion = v9ImportFloor;
    // Retain detached signature validity where the descriptor was signed;
    // community/manual provenance and unsigned entries remain unchanged.
    if (entry.signature) {
      const message = Buffer.from(moduleMessage(entry));
      const signature = sign('sha256', message, { key, dsaEncoding: 'ieee-p1363' });
      assert.ok(verify('sha256', message, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature));
      entry.signature = signature.toString('base64');
    }
    changed++;
  }
}
index.bundle.minAppVersion = v9ImportFloor;
catalogue.minAppVersion = v9ImportFloor;
assert.deepEqual(v9CompatibilityErrors(index, catalogue), []);
assert.deepEqual(signatureErrors(index, { allowCommunityIndex: true }), []);
// Retain the signed provider revision and unchanged bundle bytes; changing its
// timestamp would unnecessarily invalidate the detached provider in the bundle.
const before = JSON.parse(original.get('repository.json'));
assert.deepEqual(index.subtitleProviders, before.subtitleProviders);
assert.equal(index.publishedAtMs, before.publishedAtMs);
assert.equal(index.bundle.sha256, before.bundle.sha256);
const outputs = new Map([
  ['repository.json', JSON.stringify(index, null, 2) + '\n'],
  ['catalogue.json', JSON.stringify(catalogue, null, 2) + '\n'],
]);
const sums = new Map(original.get('SHA256SUMS').trim().split('\n').map(line => {
  const match = /^([a-f0-9]{64})\s+(.+)$/.exec(line);
  assert.ok(match);
  return [match[2], match[1]];
}));
for (const [name, bytes] of outputs) sums.set(name, hash(bytes));
outputs.set('SHA256SUMS', [...sums].map(([name, digest]) => `${digest}  ${name}`).join('\n') + '\n');
for (const [name, bytes] of original) assert.equal(read(name), bytes, 'Concurrent publication edit');
for (const [name, bytes] of outputs) fs.writeFileSync(path.join(root, name), bytes);
console.log(`Prepared V9 admission floor: ${changed} source descriptors; all package bytes and provider revision unchanged. Not published.`);
