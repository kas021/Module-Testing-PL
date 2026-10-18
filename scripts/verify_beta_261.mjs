// Frozen compatibility index. Never lower the current bundle's requirements.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'beta-261/repository.json');
const original = process.argv.includes('--prepare')
  ? execFileSync('git', ['show', 'b9e29c3:repository.json'], { cwd: root })
  : fs.readFileSync(target);
assert.equal(createHash('sha256').update(original).digest('hex'),
  '8608e21300291e738ac86509c53ff890dcf913a1628c8b944d72e9bd142e1f97');
const index = JSON.parse(original);
const compare = (a, b) => {
  const aa = a.split('.').map(Number), bb = b.split('.').map(Number);
  for (let n = 0; n < 3; n++) if (aa[n] !== bb[n]) return aa[n] - bb[n];
  return 0;
};
assert.equal(index.repositoryId, 'module-testing-pl');
assert.equal(index.bundle.version, 141);
assert.equal(index.modules.length, 40);
assert.deepEqual(signatureErrors(index, { allowCommunityIndex: true }), []);
assert.ok(compare(index.bundle.minAppVersion, '9.0.81') <= 0);
for (const module of index.modules) assert.ok(compare(module.minAppVersion, '9.0.81') <= 0);
for (const provider of index.subtitleProviders) assert.ok(compare(provider.config.minAppVersion, '9.0.81') <= 0);
for (const item of [index.bundle, ...index.modules, ...index.artworkModules]) {
  const url = new URL(item.packageUrl);
  const prefix = '/kas021/Module-Testing-PL/main/';
  assert.equal(url.origin, 'https://raw.githubusercontent.com');
  assert.ok(url.pathname.startsWith(prefix));
  const file = path.resolve(root, url.pathname.slice(prefix.length));
  assert.ok(file.startsWith(root + path.sep));
  assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), item.sha256);
}
const bundle = path.join(root, 'bundles/Synthetiq-Module-Bundle-141.zip');
const members = execFileSync('unzip', ['-Z1', bundle], { encoding: 'utf8' }).trim().split('\n');
assert.deepEqual(members.sort(), index.modules.map(m => path.basename(new URL(m.packageUrl).pathname)).sort());
for (const module of index.modules) {
  const name = path.basename(new URL(module.packageUrl).pathname);
  const bytes = execFileSync('unzip', ['-p', bundle, name], { maxBuffer: 64 * 1024 * 1024 });
  assert.equal(createHash('sha256').update(bytes).digest('hex'), module.sha256);
}
if (process.argv.includes('--prepare')) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, original, { flag: 'wx' });
}
assert.ok(fs.readFileSync(target).equals(original), 'Compatibility index must retain the original signed revision');
console.log('PASS: frozen beta-261 index, 40 module hashes, bundle members, artwork and provider signatures/minima. Current index unchanged.');
