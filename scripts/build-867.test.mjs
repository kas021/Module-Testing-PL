import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {build867} from './build-867.mjs';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'module-testing-pl-867-test-'));
test.after(() => fs.rmSync(tempRoot, {recursive: true, force: true}));

const specs = [
  ['flux', 'synthetiq-anime-direct', '1.0.3-beta.5', 'Synthetiq-Flux-1.0.3-beta.5.zip'],
  ['anime', 'synthetiq-anime-v1', '1.0.5-beta.3', 'Synthetiq-Anime-1.0.5-beta.3.zip'],
  ['anikoto', 'anikoto-v4', '5.0.5-beta.3', 'Anikoto-5.0.5-beta.3.zip'],
];

function fixturePackages(directory, override = {}) {
  fs.mkdirSync(directory, {recursive: true});
  return Object.fromEntries(specs.map(([label, id, version, filename], index) => {
    const dir = path.join(directory, label);
    fs.mkdirSync(dir, {recursive: true});
    const manifest = {
      id,
      moduleVersion: version,
      contentType: 'video',
      moduleFamilyId: `${label}_family`,
      moduleIdentity: `SP-VID-${index + 1}-${label.toUpperCase()}`,
      moduleIdentityNumber: index + 1,
      presentation: {category: 'Anime', recommended: true},
      config: {caps: {homeMaxResults: 20 + index, maxResponseBytes: 1000000, timeoutMs: 20000, maxConcurrentRequests: 2}},
      ...override[label],
    };
    fs.writeFileSync(path.join(dir, 'module.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(dir, 'index.js'), `globalThis.testModule = '${id}';\n`);
    const zipPath = path.join(directory, filename);
    execFileSync('zip', ['-j', '-X', zipPath, path.join(dir, 'module.json'), path.join(dir, 'index.js')], {stdio: 'pipe'});
    return [label, zipPath];
  }));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

test('builds a three-package min-8.6.0 sidecar without changing root artifacts', () => {
  const root = path.join(tempRoot, 'repo');
  fs.mkdirSync(path.join(root, 'bundles'), {recursive: true});
  fs.writeFileSync(path.join(root, 'repository.json'), 'root index sentinel\n');
  fs.writeFileSync(path.join(root, 'bundles', 'Testing-83.zip'), 'root bundle sentinel\n');
  const rootIndexBefore = fs.readFileSync(path.join(root, 'repository.json'));
  const rootBundleBefore = fs.readFileSync(path.join(root, 'bundles', 'Testing-83.zip'));
  const inputs = fixturePackages(path.join(tempRoot, 'inputs'));

  const result = build867({repoRoot: root, inputs, bundleVersion: 7, publishedAtMs: 1790467200000});
  const index = JSON.parse(fs.readFileSync(result.repositoryPath, 'utf8'));
  const caps = JSON.parse(fs.readFileSync(path.join(result.sidecar, 'module-caps.json'), 'utf8'));
  const bundleEntries = execFileSync('unzip', ['-Z1', result.bundlePath], {encoding: 'utf8'}).trim().split('\n').sort();

  assert.equal(index.repositoryId, 'module-testing-pl-867');
  assert.equal(index.signature, '');
  assert.equal(index.bundle.minAppVersion, '8.6.0');
  assert.equal(index.bundle.version, 7);
  assert.deepEqual(index.modules.map(item => item.moduleId), specs.map(([, id]) => id));
  assert.deepEqual(index.modules.map(item => item.version), specs.map(([, , version]) => version));
  assert.ok(index.modules.every(item => item.minAppVersion === '8.6.0' && item.signature === ''));
  assert.ok(index.modules.every(item => item.packageUrl.includes('/testing/8.6.7/modules/')));
  assert.deepEqual(bundleEntries, specs.map(([, , , filename]) => filename).sort());
  assert.equal(caps.modules.length, 3);
  assert.equal(caps.modules[0].configCaps.homeMaxResults, 20);
  assert.equal(sha256(result.bundlePath), index.bundle.sha256);
  assert.deepEqual(fs.readFileSync(path.join(root, 'repository.json')), rootIndexBefore);
  assert.deepEqual(fs.readFileSync(path.join(root, 'bundles', 'Testing-83.zip')), rootBundleBefore);
});

test('rejects extra package identities and v9-only live discovery', () => {
  const root = path.join(tempRoot, 'invalid-repo');
  const wrongIdentity = fixturePackages(path.join(tempRoot, 'wrong-id'), {
    anime: {id: 'unapproved-module-id'},
  });
  assert.throws(() => build867({repoRoot: root, inputs: wrongIdentity}), /module id synthetiq-anime-v1/);
  assert.equal(fs.existsSync(path.join(root, 'testing', '8.6.7')), false);

  const v9Only = fixturePackages(path.join(tempRoot, 'v9-only'), {
    anikoto: {config: {caps: {homeMaxResults: 10, maxResponseBytes: 1000, timeoutMs: 1000, maxConcurrentRequests: 1}, capabilities: {live_discovery_v1: true}}},
  });
  assert.throws(() => build867({repoRoot: root, inputs: v9Only}), /Player 9.0 live-discovery/);
  assert.equal(fs.existsSync(path.join(root, 'testing', '8.6.7')), false);
});

test('refuses to overwrite a published sidecar package or bundle under the same version', () => {
  const root = path.join(tempRoot, 'immutable-repo');
  const inputs = fixturePackages(path.join(tempRoot, 'immutable-inputs'));
  build867({repoRoot: root, inputs, bundleVersion: 1, publishedAtMs: 1});
  const replacedInput = fixturePackages(path.join(tempRoot, 'changed-inputs'));
  const changedFluxDir = path.join(tempRoot, 'changed-inputs', 'flux');
  fs.writeFileSync(path.join(changedFluxDir, 'index.js'), 'globalThis.testModule = "changed";\n');
  fs.unlinkSync(replacedInput.flux);
  execFileSync('zip', ['-j', '-X', replacedInput.flux,
    path.join(changedFluxDir, 'module.json'), path.join(changedFluxDir, 'index.js')], {stdio: 'pipe'});
  fs.copyFileSync(replacedInput.flux, inputs.flux);
  assert.throws(() => build867({repoRoot: root, inputs, bundleVersion: 1, publishedAtMs: 2}), /Refusing to replace immutable sidecar package/);
});
