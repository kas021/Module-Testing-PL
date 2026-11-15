'use strict';
// Read-only network/package audit; never executes module handlers or signs data.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const root = path.resolve(__dirname, '..');
const mainCommit = '6c161b923a1c79a7a0571c71823c876d7421bb07';
const testCommit = 'ff0315a7edeeeba12703f2b5fd39833c2b787371';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f)));
const baseline = f => JSON.parse(cp.execFileSync('git', ['show', `${testCommit}:${f}`], { cwd: root }));
const json = j => JSON.stringify(j, null, 2) + '\n';
const holds = {
  'yflix-v1': 'Prior exact-candidate S2 FAIL: caption-language contradictions; no fresh runtime slot.',
  'megakino-v1': 'Prior Sub unavailable; Dub language inconclusive; no fresh runtime slot.',
  'moviedb-wiki-v1': 'Prior S2 FAIL: emitted episode reference rejected by resolver; no fresh runtime slot.',
  'movy-v1': 'Prior adapted-standard FAIL: sustained native TCP read error; no fresh runtime slot.',
};
async function bytes(url, limit = 16777216, redirect = 'follow') {
  const r = await fetch(url, { redirect, signal: AbortSignal.timeout(30000) });
  assert.equal(r.status, 200, `HTTP ${r.status}: ${url}`);
  let n = 0; const chunks = [];
  for await (const c of r.body) { n += c.length; assert(n <= limit); chunks.push(c); }
  return { body: Buffer.concat(chunks), mime: r.headers.get('content-type'), url: r.url };
}
function unpack(b) {
  const z = new Zip(b), entries = z.getEntries().filter(e => !e.isDirectory);
  assert(entries.length && entries.length < 100);
  const names = new Set();
  for (const e of entries) {
    assert(!names.has(e.entryName)); names.add(e.entryName);
    assert(!e.entryName.startsWith('/') && !e.entryName.includes('\\'));
    assert(!e.entryName.split('/').some(p => p === '..' || p === '.'));
    assert(e.header.size <= 16777216);
  }
  const manifests = entries.filter(e => e.entryName.endsWith('.json')).map(e => ({ name: e.entryName, m: JSON.parse(e.getData()) })).filter(x => x.m.id && x.m.config?.runtime);
  assert.equal(manifests.length, 1);
  const { name, m } = manifests[0];
  const files = Object.fromEntries(entries.map(e => [e.entryName, hash(e.getData())]));
  for (const e of entries.filter(e => e.entryName.endsWith('.js'))) new vm.Script(e.getData().toString(), { filename: e.entryName });
  return { m, name, files };
}
function diff(a, b, prefix = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) return [prefix];
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => diff(a[k], b[k], prefix ? `${prefix}.${k}` : k));
}
function localFile(d) {
  const prefix = '/kas021/Module-Testing-PL/main/';
  const u = new URL(d.packageUrl);
  assert.equal(u.hostname, 'raw.githubusercontent.com');
  assert(u.pathname.startsWith(prefix));
  const f = u.pathname.slice(prefix.length);
  assert(!f.split('/').includes('..'));
  return f;
}
(async () => {
  const official = await bytes(`https://raw.githubusercontent.com/kas021/Synthetiq-Modules/${mainCommit}/repository.json`);
  const main = JSON.parse(official.body), test = read('repository.json'), before = baseline('repository.json');
  const catalogue = read('catalogue.json'), oldCatalogue = baseline('catalogue.json');
  const expected = structuredClone(before), expectedCatalogue = structuredClone(oldCatalogue);
  expected.modules.find(m => m.moduleId === 'movy-v1').presentation.iconUrl = 'https://www.movy.sx/apple-touch-icon.png';
  expectedCatalogue.modules.find(m => m.file === 'modules/Movy-0.1.0-beta.1.zip').presentation.iconUrl = 'https://www.movy.sx/apple-touch-icon.png';
  assert.deepEqual(test, expected, 'Unexpected index mutation');
  assert.deepEqual(catalogue, expectedCatalogue, 'Unexpected catalogue mutation');
  const publicTest = await bytes(`https://raw.githubusercontent.com/kas021/Module-Testing-PL/${testCommit}/repository.json`);
  assert.deepEqual(JSON.parse(publicTest.body), before);
  const rows = [];
  for (const t of test.modules) {
    const file = localFile(t), b = fs.readFileSync(path.join(root, file));
    assert.equal(hash(b), t.sha256);
    const tp = unpack(b);
    assert.equal(tp.m.id, t.moduleId); assert.equal(tp.m.moduleVersion, t.version);
    const u = main.modules.find(m => m.moduleId === t.moduleId);
    let row = { id: t.moduleId, testVersion: t.version, testSha256: t.sha256, file,
      testManifestSha256: tp.files[tp.name], testFiles: tp.files,
      preservedV9: { catalogueMapping: tp.m.config.catalogueMapping, sourceFallbacks: tp.m.config.sourceFallbacks } };
    if (!u) row.disposition = 'KEEP_TEST_ONLY';
    else {
      for (const k of ['moduleId', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType']) assert.deepEqual(u[k], t[k]);
      // Pin package bytes to the official commit, never a mutable release URL.
      const packagePath = u.packagePath.includes('/releases/download/')
        ? `modules/${new URL(u.packageUrl).pathname.split('/').pop()}`
        : new URL(u.packageUrl).pathname.split('/main/')[1];
      assert(packagePath && !packagePath.split('/').includes('..'));
      const mb = (await bytes(`https://raw.githubusercontent.com/kas021/Synthetiq-Modules/${mainCommit}/${packagePath}`)).body;
      assert.equal(hash(mb), u.sha256, `Official hash drift: ${t.moduleId}`);
      const mp = unpack(mb);
      assert.equal(mp.m.id, u.moduleId); assert.equal(mp.m.moduleVersion, u.version);
      for (const k of ['id', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType']) assert.deepEqual(mp.m[k], tp.m[k]);
      const changedFiles = diff(mp.files, tp.files);
      const executableChanges = changedFiles.filter(f => f !== mp.name && f !== tp.name);
      Object.assign(row, { mainVersion: u.version, mainSha256: u.sha256, mainFiles: mp.files,
        changedFiles, manifestChanges: diff(mp.m, tp.m), executableChanges,
        disposition: t.sha256 === u.sha256 ? 'IDENTICAL' : holds[t.moduleId] ? 'HOLD_UPSTREAM' : executableChanges.length ? 'KEEP_TEST_NEWER' : 'KEEP_TEST_OVERLAY',
        reason: holds[t.moduleId] });
    }
    rows.push(row);
  }
  assert(main.modules.every(u => test.modules.some(t => t.moduleId === u.moduleId)), 'Unreviewed MAIN-only module');
  const logos = [];
  for (const id of ['drama-direct-v1', 'movy-v1']) {
    const d = test.modules.find(m => m.moduleId === id);
    const url = d.presentation.iconUrl;
    assert.equal(catalogue.modules.find(m => m.file === localFile(d)).presentation.iconUrl, url);
    const r = await bytes(url, 1048576, 'manual');
    assert(r.mime?.startsWith('image/png'));
    assert.equal(r.body.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    logos.push({ id, url, http: 200, redirects: 0, mime: r.mime, bytes: r.body.length,
      width: r.body.readUInt32BE(16), height: r.body.readUInt32BE(20), sha256: hash(r.body) });
  }
  const manifest = { auditedAt: new Date().toISOString(), mainCommit, testCommit,
    mainIndexSha256: hash(official.body), previousTestIndexSha256: hash(publicTest.body),
    stagedIndexSha256: hash(fs.readFileSync(path.join(root, 'repository.json'))),
    stagedCatalogueSha256: hash(fs.readFileSync(path.join(root, 'catalogue.json'))),
    mainBundle: main.bundle, testBundle: test.bundle,
    changed: [{ id: 'movy-v1', field: 'presentation.iconUrl', previous: null, next: logos.find(l => l.id === 'movy-v1').url,
      files: ['repository.json', 'catalogue.json'], packageBytesChanged: false, versionChanged: false }],
    packageChanges: [], rows, logos,
    runtimeCertification: 'QUEUED_PARENT_SERIALIZED_SLOT_NOT_RUN', publication: 'NOT_AUTHORIZED_NOT_PUSHED',
    signaturePolicy: 'All original signatures and publication revisions retained; presentation is outside canonical signed messages. No signing key accessed.',
    risks: ['Static ZIP parsing and JS compilation are not runtime, stream, subtitle, audio or physical-device proof.',
      'Logo URL availability can change. Movy apex returned HTTP 451; www logo endpoint returned direct PNG.',
      'Community TEST index and bundle are intentionally unsigned; native declarations remain signed and verifier-checked.',
      'Removing app hardcoded fallbacks requires native import/render acceptance by parent; not tested here.'] };
  fs.writeFileSync(path.join(root, 'docs/V9_RELEASE_SYNC_20261115.json'), json(manifest));
  console.log(json({ rows: rows.length, dispositions: rows.reduce((a, r) => (a[r.disposition] = (a[r.disposition] || 0) + 1, a), {}), logos, stagedIndexSha256: manifest.stagedIndexSha256, stagedCatalogueSha256: manifest.stagedCatalogueSha256 }));
})().catch(e => { console.error(e); process.exitCode = 1; });
