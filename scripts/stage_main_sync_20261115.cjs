'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const QA = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const runtime = '/Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114';
const output = path.join(runtime, 'dev_assets/modules/_development/main-test-sync-20261115');
const ids = ['yflix-v1', 'animeheaven-v2-1', 'xstream-v1', 'megakino-v1', 'streamingunity-v1', 'moviedb-wiki-v1', 'movy-v1'];
const queries = { 'yflix-v1': 'Inception', 'animeheaven-v2-1': 'Frieren', 'xstream-v1': 'Inception',
  'megakino-v1': 'Inception', 'streamingunity-v1': 'Inception', 'moviedb-wiki-v1': 'Inception', 'movy-v1': 'Fight Club' };
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => JSON.parse(fs.readFileSync(f));
const main = read(path.join(QA, 'Synthetiq-Modules.json'));
const test = read(path.join(QA, 'Module-Testing-PL.json'));
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(path.join(QA, 'candidates'), { recursive: true });
fs.chmodSync(QA, 0o700);
const rows = [];
for (const id of ids) {
  const descriptor = main.modules.find(m => m.moduleId === id);
  const previous = test.modules.find(m => m.moduleId === id);
  const original = fs.readFileSync(path.join(QA, 'main', id + '.zip'));
  assert.equal(hash(original), descriptor.sha256);
  const z = new Zip(original), oldZip = new Zip(fs.readFileSync(path.join(QA, 'test', id + '.zip')));
  const manifest = JSON.parse(z.getEntry('module.json').getData());
  const old = JSON.parse(oldZip.getEntry('module.json').getData());
  for (const field of ['id', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType']) {
    assert.deepEqual(manifest[field], old[field], id + ': changed lineage ' + field);
  }
  let overlay = false;
  for (const field of ['catalogueMapping', 'sourceFallbacks']) {
    if (old.config?.[field] === undefined) continue;
    if (manifest.config[field] !== undefined) assert.deepEqual(manifest.config[field], old.config[field], id + ': conflicting TEST overlay');
    else { manifest.config[field] = old.config[field]; overlay = true; }
  }
  if (overlay) z.updateFile('module.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
  const bytes = overlay ? z.toBuffer() : original;
  const sealed = new Zip(bytes);
  assert.deepEqual(sealed.getEntries().map(e => e.entryName), z.getEntries().map(e => e.entryName));
  for (const e of new Zip(original).getEntries()) {
    if (e.entryName !== 'module.json') assert.deepEqual(sealed.getEntry(e.entryName).getData(), e.getData(), id + ': executable changed');
  }
  const file = id + '-' + manifest.moduleVersion + '.zip';
  for (const dir of [output, path.join(QA, 'candidates')]) {
    const dest = path.join(dir, file);
    if (fs.existsSync(dest)) assert.equal(hash(fs.readFileSync(dest)), hash(bytes), 'Immutable candidate drift');
    else fs.writeFileSync(dest, bytes, { flag: 'wx' });
  }
  const row = { id, previousVersion: previous.version, version: manifest.moduleVersion, file,
    sha256: hash(bytes), mainSha256: descriptor.sha256, manifestOverlay: overlay,
    jsSha256: hash(sealed.getEntry('index.js').getData()), query: queries[id],
    runtimeZip: path.join(output, file) };
  rows.push(row);
  console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(QA, 'candidates.json'), JSON.stringify(rows, null, 2) + '\n');
