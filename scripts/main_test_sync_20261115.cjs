'use strict';
// Inspect immutable upstream packages without changing any active catalogue.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const ROOT = path.resolve(__dirname, '..');
const QA = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const MAIN = '6c161b923a1c79a7a0571c71823c876d7421bb07';
const TEST = '7be583c42d754486a39051ab3c8187c0274388a7';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const write = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
async function fetchBytes(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(45000) });
  assert.equal(r.status, 200, 'HTTP ' + r.status + ' for ' + url);
  const parts = []; let size = 0;
  for await (const part of r.body) {
    size += part.length;
    assert(size <= 16777216, 'Response exceeds 16 MiB');
    parts.push(part);
  }
  return Buffer.concat(parts);
}
function unpack(bytes) {
  const z = new Zip(bytes);
  const entries = z.getEntries().filter(e => !e.isDirectory);
  assert(entries.every(e => !e.entryName.startsWith('/') && !e.entryName.includes('\\') &&
    !e.entryName.split('/').some(p => p === '..' || p === '.')), 'Unsafe ZIP member');
  const manifests = entries.filter(e => e.entryName.endsWith('.json') && e.header.size < 1048576)
    .map(e => { try { return { name: e.entryName, data: JSON.parse(e.getData().toString()) }; } catch { return null; } })
    .filter(e => e?.data?.id && e.data.config?.runtime);
  assert.equal(manifests.length, 1, 'Expected one module manifest');
  return { z, name: manifests[0].name, m: manifests[0].data,
    files: Object.fromEntries(entries.map(e => [e.entryName, hash(e.getData())])) };
}
function differences(a, b, prefix = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) return [prefix];
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => differences(a[k], b[k], prefix ? prefix + '.' + k : k));
}
(async () => {
  fs.mkdirSync(QA, { recursive: true });
  const feeds = {};
  for (const [repo, sha] of [['Synthetiq-Modules', MAIN], ['Module-Testing-PL', TEST]]) {
    const file = path.join(QA, repo + '.json');
    const bytes = fs.existsSync(file) ? fs.readFileSync(file) : await fetchBytes(`https://raw.githubusercontent.com/kas021/${repo}/${sha}/repository.json`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, bytes, { flag: 'wx' });
    feeds[repo] = JSON.parse(bytes);
  }
  const main = feeds['Synthetiq-Modules'], test = feeds['Module-Testing-PL'];
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'repository.json'))), test, 'TEST baseline drift');
  const records = [];
  for (const upstream of main.modules) {
    const previous = test.modules.find(m => m.moduleId === upstream.moduleId);
    assert(previous, 'New MAIN module needs explicit review: ' + upstream.moduleId);
    for (const key of ['moduleId', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType']) {
      assert.deepEqual(upstream[key], previous[key], upstream.moduleId + ': identity differs: ' + key);
    }
    if (previous.sha256 === upstream.sha256) continue;
    const data = {};
    for (const [lane, descriptor] of [['main', upstream], ['test', previous]]) {
      const dir = path.join(QA, lane); fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, descriptor.moduleId + '.zip');
      let bytes;
      if (fs.existsSync(file)) bytes = fs.readFileSync(file);
      else if (lane === 'test') {
        const relative = new URL(descriptor.packageUrl).pathname.split('/main/')[1];
        assert(relative && !relative.split('/').includes('..'));
        bytes = fs.readFileSync(path.join(ROOT, relative));
        fs.writeFileSync(file, bytes, { flag: 'wx' });
      } else {
        bytes = await fetchBytes(descriptor.packageUrl);
        fs.writeFileSync(file, bytes, { flag: 'wx' });
      }
      assert.equal(hash(bytes), descriptor.sha256, descriptor.moduleId + ': ' + lane + ' hash mismatch');
      data[lane] = unpack(bytes);
      assert.equal(data[lane].m.id, descriptor.moduleId);
      assert.equal(data[lane].m.moduleVersion, descriptor.version);
    }
    const changedFiles = differences(data.main.files, data.test.files);
    const nonManifest = changedFiles.filter(f => f !== data.main.name && f !== data.test.name);
    const manifestChanges = differences(data.main.m, data.test.m);
    const record = { id: upstream.moduleId, mainVersion: upstream.version, testVersion: previous.version,
      mainSha256: upstream.sha256, testSha256: previous.sha256, changedFiles, nonManifest,
      manifestChanges, testOverlayKeys: Object.keys(data.test.m.config || {}).filter(k => !Object.hasOwn(data.main.m.config || {}, k)),
      mainManifest: data.main.name, testManifest: data.test.name };
    records.push(record);
    console.log(JSON.stringify(record));
  }
  write(path.join(QA, 'comparison.json'), { mainCommit: MAIN, testCommit: TEST, mainBundle: main.bundle.version,
    testBundle: test.bundle.version, records,
    testOnly: test.modules.filter(m => !main.modules.some(u => u.moduleId === m.moduleId)).map(m => ({ id: m.moduleId, version: m.version, sha256: m.sha256 })) });
})().catch(e => { console.error(e.message); process.exitCode = 1; });
