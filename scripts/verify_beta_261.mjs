// Build 261 compatibility catalogue. Root V9 admission is verified separately.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'beta-261/repository.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const retainedPath = 'beta-261/Synthetiq-Module-Bundle-141-without-one.zip';
const prefix = '/kas021/Module-Testing-PL/main/';
const bundleHash = '8c796ee9e27208a43b87d950d166167cff039c1e23712ab77e2d2d799f35892e';
const indexHash = 'dd1506f3567a2c63d9fe834c2f2fb06a6be3c1e2be930ca70aa59c2ba4e38d41';
const retired = 'synthetiq-one-v1';
function fromFrozenRevision() {
  const bytes = execFileSync('git', ['show', 'b9e29c39d7b78cdb1bec3a1eb0489d405d25f8ad:repository.json'], { cwd: root });
  assert.equal(sha(bytes), '8608e21300291e738ac86509c53ff890dcf913a1628c8b944d72e9bd142e1f97');
  const historical = JSON.parse(bytes);
  historical.modules = historical.modules.filter(m => m.moduleId !== retired);
  historical.testingIdentity = historical.modules.map(m => [m.moduleId, m.version, m.sha256].join(':')).join('|');
  historical.bundle.packagePath = prefix + retainedPath;
  historical.bundle.packageUrl = 'https://raw.githubusercontent.com' + historical.bundle.packagePath;
  historical.bundle.sha256 = bundleHash;
  return Buffer.from(JSON.stringify(historical, null, 2) + '\n');
}
const prepare = process.argv.includes('--prepare');
const bytes = prepare ? fromFrozenRevision() : fs.readFileSync(target);
assert.equal(sha(bytes), indexHash, 'Compatibility manifest changed');
const index = JSON.parse(bytes);
const compare = (a, b) => {
  const aa = a.split('.').map(Number), bb = b.split('.').map(Number);
  for (let n = 0; n < 3; n++) if (aa[n] !== bb[n]) return aa[n] - bb[n];
  return 0;
};
assert.equal(index.repositoryId, 'module-testing-pl');
assert.equal(index.bundle.version, 141);
assert.equal(index.modules.length, 39);
assert.ok(!index.modules.some(m => m.moduleId === retired));
assert.equal(index.bundle.packagePath, prefix + retainedPath);
assert.equal(index.bundle.sha256, bundleHash);
assert.deepEqual(signatureErrors(index, { allowCommunityIndex: true }), []);
assert.ok(compare(index.bundle.minAppVersion, '9.0.81') <= 0);
for (const module of index.modules) assert.ok(compare(module.minAppVersion, '9.0.81') <= 0);
for (const provider of index.subtitleProviders) assert.ok(compare(provider.config.minAppVersion, '9.0.81') <= 0);
for (const item of [index.bundle, ...index.modules, ...index.artworkModules]) {
  const url = new URL(item.packageUrl);
  assert.equal(url.origin, 'https://raw.githubusercontent.com');
  if (item.packagePath !== undefined) assert.equal(url.pathname, item.packagePath);
  assert.ok(url.pathname.startsWith(prefix));
  const file = path.resolve(root, url.pathname.slice(prefix.length));
  assert.ok(file.startsWith(root + path.sep));
  assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), item.sha256);
}
const bundle = path.join(root, retainedPath);
const members = execFileSync('unzip', ['-Z1', bundle], { encoding: 'utf8' }).trim().split('\n');
const expectedMembers = index.modules.map(m => path.basename(new URL(m.packageUrl).pathname)).sort();
function verifyMembers(actual) { assert.deepEqual([...actual].sort(), expectedMembers); }
verifyMembers(members);
for (const module of index.modules) {
  const name = path.basename(new URL(module.packageUrl).pathname);
  const bytes = execFileSync('unzip', ['-p', bundle, name], { maxBuffer: 64 * 1024 * 1024 });
  assert.equal(createHash('sha256').update(bytes).digest('hex'), module.sha256);
}
if (process.argv.includes('--self-test')) {
  assert.deepEqual(bytes, fromFrozenRevision(), 'All retained historical declarations must match byte-for-byte');
  const historicalBundle = fs.readFileSync(path.join(root, 'bundles/Synthetiq-Module-Bundle-141.zip'));
  assert.equal(sha(historicalBundle), '7596ee59e0928443df76f63c38b175bfb13103411e3d4db62cc2fbb75a9444b8');
  assert.throws(() => verifyMembers([...members, 'Synthetiq-One-1.3.0.zip']), assert.AssertionError);
  assert.throws(() => verifyMembers(members.slice(1)), assert.AssertionError);
  assert.throws(() => verifyMembers([...members.slice(1), members[1]]), assert.AssertionError);
  console.log('PASS: original 40-entry revision minus only Synthetiq One; historical bundle intact; extra, missing and duplicate members rejected.');
}
if (prepare) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { flag: 'wx' });
}
console.log('PASS: beta-261 manifest, 39 package and embedded member hashes, artwork and provider signatures/minima.');
