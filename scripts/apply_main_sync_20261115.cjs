'use strict';
// TEST-only publication preparation. Requires explicit exact-hash approvals.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const root = path.resolve(__dirname, '..');
const qa = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const read = f => JSON.parse(fs.readFileSync(f));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const json = j => JSON.stringify(j, null, 2) + '\n';
const baseline = read(path.join(qa, 'Module-Testing-PL.json'));
const main = read(path.join(qa, 'Synthetiq-Modules.json'));
const candidates = read(path.join(qa, 'candidates.json'));
const approvals = read(path.join(qa, 'approved.json'));
const index = read(path.join(root, 'repository.json'));
const catalogue = read(path.join(root, 'catalogue.json'));
assert.deepEqual(index, baseline, 'TEST baseline changed; stop and rebase');
assert.equal(index.repositoryId, 'module-testing-pl');
assert.equal(catalogue.minAppVersion, '9.0.0');
assert(Array.isArray(approvals));
assert.equal(new Set(approvals.map(a => a.id)).size, approvals.length);
const changed = [];
for (const approval of approvals) {
  const candidate = candidates.find(c => c.id === approval.id);
  assert(candidate && candidate.sha256 === approval.sha256);
  const report = read(approval.report);
  assert.equal(report.inspection.sha256, candidate.sha256, 'Report is for different bytes');
  assert(['PASS', 'PARTIAL'].includes(report.grade), 'Failed candidate cannot be promoted');
  assert.deepEqual(report.failureCodes, []);
  assert.equal(report.runtime.ok, true);
  assert.equal(report.profile, 'standard', 'Simulator acceptance required for bundle inclusion');
  assert.equal(report.simulator?.ok, true, 'Simulator playback must pass');
  assert(report.media.length && report.media.every(m => m.analysis?.ok), 'Media probe incomplete');
  const execution = read(approval.execution);
  assert.equal(execution.runId, report.runId);
  assert.equal(execution.zipSha256, candidate.sha256);
  assert.equal(execution.sourceCommit, '797804dda4884c0333aeaf8e9595405a4b240034');
  assert.equal(execution.sourceUnmodified, true);
  assert.equal(execution.functionalAssertionsChanged, false);
  assert.equal(execution.standardObservationSeconds, 120);
  assert.equal(execution.labProcessBudgetMs, 900000);
  assert.equal(approval.visualReviewed, true, 'Review the native post-seek capture');
  const descriptor = index.modules.find(m => m.moduleId === candidate.id);
  const upstream = main.modules.find(m => m.moduleId === candidate.id);
  const oldFile = new URL(descriptor.packageUrl).pathname.split('/main/')[1];
  const entry = catalogue.modules.find(m => m.file === oldFile);
  assert(entry);
  const bytes = fs.readFileSync(candidate.runtimeZip);
  assert.equal(hash(bytes), candidate.sha256);
  const relative = 'modules/' + candidate.file;
  assert(!fs.existsSync(path.join(root, relative)), 'Do not overwrite immutable package');
  fs.writeFileSync(path.join(root, relative), bytes, { flag: 'wx' });
  const note = `MAIN-to-TEST sync 2026-11-15: existing published MAIN resolver code; exact TEST candidate adapted-standard S2 ${report.grade}, runtime, sampled media and full simulator playback/pause/seek checks passed. Compile/setup allowance 900s; playback assertions unchanged. Not physical-device or full-title/audio/caption certification. Existing V9 fallback metadata retained.`;
  entry.file = relative;
  entry.presentation = structuredClone(upstream.presentation || entry.presentation || {});
  entry.changelog = [...new Set([note, ...(upstream.changelog || []), ...(entry.changelog || [])])];
  Object.assign(descriptor, { version: candidate.version, sha256: candidate.sha256, signature: '',
    publishedAtMs: Date.now(), presentation: entry.presentation, changelog: entry.changelog,
    packageUrl: 'https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/' + relative,
    packagePath: '/kas021/Module-Testing-PL/main/' + relative });
  changed.push({ id: candidate.id, previousVersion: candidate.previousVersion, version: candidate.version,
    file: relative, sha256: candidate.sha256, mainSha256: candidate.mainSha256,
    retainedManifestOverlay: candidate.manifestOverlay, grade: report.grade, runId: report.runId,
    observedMs: report.simulator.summary.observedMs, labProcessBudgetMs: execution.labProcessBudgetMs,
    playbackFixtureSha256: execution.playbackFixtureSha256, physicalAcceptance: false });
}
const metadataOnly = [];
for (const id of ['drama-direct-v1', 'kickassanime-v3']) {
  const descriptor = index.modules.find(m => m.moduleId === id);
  const upstream = main.modules.find(m => m.moduleId === id);
  const relative = new URL(descriptor.packageUrl).pathname.split('/main/')[1];
  const entry = catalogue.modules.find(m => m.file === relative);
  assert.equal(descriptor.sha256, upstream.sha256, 'Logo-only edit must not change package');
  descriptor.presentation = structuredClone(upstream.presentation);
  entry.presentation = structuredClone(upstream.presentation);
  metadataOnly.push(id);
}
const changedIds = new Set(changed.map(c => c.id));
for (const before of baseline.modules) {
  const after = index.modules.find(m => m.moduleId === before.moduleId);
  if (!changedIds.has(before.moduleId)) {
    if (!metadataOnly.includes(before.moduleId)) assert.deepEqual(after, before);
    else assert.deepEqual({ ...after, presentation: before.presentation }, before);
  } else {
    for (const k of ['moduleId', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType', 'minAppVersion']) {
      assert.deepEqual(after[k], before[k], 'Lineage/import floor changed: ' + k);
    }
  }
}
for (const field of ['artworkModules', 'defaultModules', 'defaultModulesSignature']) assert.deepEqual(index[field], baseline[field]);
for (const field of ['metadataProviders', 'subtitleProviders']) {
  assert.deepEqual(index[field], baseline[field], 'Provider configuration changed before re-signing');
}
const previousBundle = new Zip(fs.readFileSync(path.join(root,
  new URL(baseline.bundle.packageUrl).pathname.split('/main/')[1])));
const extras = previousBundle.getEntries().filter(e => !e.entryName.endsWith('.zip'));
const existing = fs.readdirSync(path.join(root, 'bundles')).map(f => /^Synthetiq-Module-Bundle-(\d+)\.zip$/.exec(f)).filter(Boolean).map(m => Number(m[1]));
const next = Math.max(index.bundle.version, ...existing) + 1;
const bundleFile = `bundles/Synthetiq-Module-Bundle-${next}.zip`;
catalogue.bundleVersion = next;
catalogue.bundleFile = bundleFile;
index.publishedAtMs = Math.max(Date.now(), baseline.publishedAtMs + 1);
index.testingIdentity = index.modules.map(m => `${m.moduleId}:${m.version}:${m.sha256}`).join('|');
Object.assign(index.bundle, { version: next, signature: '',
  packageUrl: 'https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/' + bundleFile,
  packagePath: '/kas021/Module-Testing-PL/main/' + bundleFile });
function bundle() {
  const zip = new Zip();
  for (const item of catalogue.modules) zip.addFile(path.basename(item.file), fs.readFileSync(path.join(root, item.file)));
  for (const e of extras) {
    const bytes = e.entryName === 'synthetiq-subtitles.provider.json'
      ? fs.readFileSync(path.join(root, 'subtitle-provider.json')) : e.getData();
    zip.addFile(e.entryName, bytes);
  }
  const bytes = zip.toBuffer();
  fs.writeFileSync(path.join(root, bundleFile), bytes);
  index.bundle.sha256 = hash(bytes);
  fs.writeFileSync(path.join(root, 'repository.json'), json(index));
}
fs.writeFileSync(path.join(root, 'catalogue.json'), json(catalogue));
bundle();
cp.execFileSync(process.execPath, ['scripts/sign_repository.mjs', '--community', '--write'], { cwd: root, stdio: 'inherit' });
const signed = read(path.join(root, 'repository.json'));
index.subtitleProviders = signed.subtitleProviders;
index.metadataProviders = signed.metadataProviders;
bundle();
const sums = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map(line => {
  const m = /^([a-f0-9]{64})  (.+)$/.exec(line); assert(m); return [m[2], m[1]];
}));
for (const file of ['repository.json', 'catalogue.json', 'subtitle-provider.json', bundleFile, ...changed.map(c => c.file)]) {
  sums.set(file, hash(fs.readFileSync(path.join(root, file))));
}
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums].map(([file, digest]) => digest + '  ' + file).join('\n') + '\n');
const receipt = { mainCommit: '6c161b923a1c79a7a0571c71823c876d7421bb07',
  previousTestCommit: '7be583c42d754486a39051ab3c8187c0274388a7', previousBundle: baseline.bundle.version,
  bundle: next, bundleSha256: index.bundle.sha256, changed, metadataOnly,
  retainedNewer: ['synthetiq-anime-v1', 'miruro-v3'], moduleCount: index.modules.length,
  publication: 'NOT YET PUSHED' };
fs.writeFileSync(path.join(qa, 'prepared.json'), json(receipt));
console.log(json(receipt));
