// Publish preparation only. Eligibility is bound to exact S2-tested ZIP bytes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const v9 = '/Volumes/ZX20/.codex-worktrees/player-v9';
const Zip = require(path.join(v9, 'MODULE_TESTER/node_modules/adm-zip'));
const settings = process.env.TEST_SYNC_CONFIG ? JSON.parse(fs.readFileSync(process.env.TEST_SYNC_CONFIG)) : {};
const qa = settings.qa || path.join(v9, 'dev_assets/modules/_development/playback-triage-20261111/test-sync');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file));
const write = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
const index = read(path.join(root, 'repository.json'));
const original = read(path.join(qa, settings.baseline || 'Module-Testing-PL.json'));
const catalogue = read(path.join(root, 'catalogue.json'));
assert.deepEqual(index, original, 'Baseline drift; reassess instead of overwriting');
assert.equal(index.repositoryId, 'module-testing-pl');
assert.equal(index.bundle.version, settings.baseBundle || 156);
const nextBundle = settings.nextBundle || 157;
assert.equal(nextBundle,index.bundle.version+1);
const approvals = read(path.join(qa, 'eligible.json'));
const candidates = read(path.join(qa, 'candidates.json'));
assert.ok(approvals.length > 0);
const allowed = new Set(['anikoto-v4','miruro-v3','moviedb-wiki-v1','synthetiq-anime-v1']);
assert.equal(new Set(approvals.map(a => a.id)).size, approvals.length);
const pending = [];
const changed = [];
for (const approval of approvals) {
  assert.ok(allowed.has(approval.id));
  const c = candidates.find(c => c.id === approval.id);
  assert.ok(c);
  assert.equal(path.basename(c.file), c.file);
  const bytes = fs.readFileSync(path.join(qa, c.file));
  assert.equal(hash(bytes), c.sha256);
  const reportPath = fs.realpathSync(approval.report);
  assert.ok(reportPath.startsWith(path.join(v9, 'MODULE_TESTER/reports/runs/')));
  const report = read(reportPath);
  assert.equal(report.profile, 'standard');
  assert.ok(['PASS', 'PARTIAL'].includes(report.grade));
  assert.deepEqual(report.failureCodes, []);
  assert.equal(report.inspection.sha256, c.sha256);
  assert.equal(report.runtime.ok, true);
  assert.equal(report.simulator.ok, true);
  if (report.grade === 'PARTIAL') assert.ok(approval.limits?.length);
  if (settings.dualVersion || settings.runtimeLanes) {
    const lanes=settings.runtimeLanes || ['legacy','v9'];
    assert.ok(Array.isArray(lanes) && lanes.length>0 && lanes.every(l=>['legacy','v9'].includes(l)));
    for (const lane of lanes) {
      const receiptPath=fs.realpathSync(approval.runtimeReceipts[lane]);
      assert.ok(receiptPath.startsWith(path.join(v9,'dev_assets/modules/_development/dual-maintenance-20261111/runtime/')));
      const receipt=read(receiptPath);
      assert.equal(receipt.lane,lane);assert.equal(receipt.id,c.id);
      assert.equal(receipt.grade,'PASS');
      assert.equal(receipt.sha256,lane==='v9'?c.sha256:c.legacySha256);
      for (const step of ['import','load','episodes','stream','playability','downloadProbe']) assert.equal(receipt.steps[step]?.ok,true,`${lane}: ${step}`);
    }
  }
  const m = index.modules.find(m => m.moduleId === c.id);
  assert.equal(c.previousVersion, m.version);
  const manifest = JSON.parse(new Zip(bytes).getEntry('module.json').getData());
  assert.equal(manifest.id, c.id);
  assert.equal(manifest.moduleVersion, c.version);
  const oldFile = decodeURIComponent(new URL(m.packageUrl).pathname.split('/main/')[1]);
  const entry = catalogue.modules.find(e => e.file === oldFile);
  assert.ok(entry);
  const filename = `${c.id}-${c.version}.zip`, relative = `modules/${filename}`;
  assert.ok(!fs.existsSync(path.join(root, relative)), 'Immutable archive already exists');
  pending.push({relative, bytes});
  entry.file = relative;
  const upstream = read(path.join(qa, 'Synthetiq-Modules.json')).modules.find(m => m.moduleId === c.id);
  const note = `TEST-only ${c.version}: standard S2 ${report.grade}. ${approval.summary} Limits: ${approval.limits}. Existing fallback settings and explicit Off are unchanged.`;
  entry.changelog = [...new Set([note, ...(upstream.changelog || []), ...(entry.changelog || [])])];
  Object.assign(m, {version:c.version, sha256:c.sha256, signature:'', publishedAtMs:Date.now(),
    packageUrl:`https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${relative}`,
    packagePath:`/kas021/Module-Testing-PL/main/${relative}`, changelog:entry.changelog});
  changed.push({id:c.id, previousVersion:c.previousVersion, version:c.version, file:relative,
    sha256:c.sha256, grade:report.grade, runId:report.runId, limits:approval.limits});
}
const changedIds = new Set(changed.map(c => c.id));
for (const old of original.modules) {
  const now = index.modules.find(m => m.moduleId === old.moduleId);
  if (!changedIds.has(old.moduleId)) assert.deepEqual(now, old);
  else for (const k of ['moduleId','moduleIdentity','moduleIdentityNumber','moduleFamilyId','minAppVersion','presentation']) assert.deepEqual(now[k], old[k]);
}
assert.equal(index.modules.length, 45);
for (const k of ['artworkModules','defaultModules','defaultModulesSignature']) assert.deepEqual(index[k], original[k]);
const bundleFile = `bundles/Synthetiq-Module-Bundle-${nextBundle}.zip`;
assert.ok(!fs.existsSync(path.join(root, bundleFile)));
for (const item of pending) fs.writeFileSync(path.join(root, item.relative), item.bytes, {flag:'wx'});
catalogue.bundleVersion = nextBundle;
catalogue.bundleFile = bundleFile;
index.publishedAtMs = Math.max(Date.now(), original.publishedAtMs + 1);
index.testingIdentity = index.modules.map(m => `${m.moduleId}:${m.version}:${m.sha256}`).join('|');
Object.assign(index.bundle, {version:nextBundle, signature:'',
  packageUrl:`https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundleFile}`,
  packagePath:`/kas021/Module-Testing-PL/main/${bundleFile}`});
function bundle(provider) {
  const zip = new Zip();
  for (const e of catalogue.modules) zip.addFile(path.basename(e.file), fs.readFileSync(path.join(root, e.file)));
  if (provider) zip.addFile('synthetiq-subtitles.provider.json', provider);
  const bytes = zip.toBuffer();
  fs.writeFileSync(path.join(root, bundleFile), bytes);
  index.bundle.sha256 = hash(bytes);
  write(path.join(root, 'repository.json'), index);
}
write(path.join(root, 'catalogue.json'), catalogue);
bundle();
cp.execFileSync('node', ['scripts/sign_repository.mjs','--community','--write'], {cwd:root,stdio:'inherit'});
const signed = read(path.join(root, 'repository.json'));
index.subtitleProviders = signed.subtitleProviders;
index.metadataProviders = signed.metadataProviders;
bundle(fs.readFileSync(path.join(root, 'subtitle-provider.json')));
const sums = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map(line => {
  const [, digest, filename] = /^([a-f0-9]{64})  (.+)$/.exec(line); return [filename,digest];
}));
for (const file of ['repository.json','catalogue.json','subtitle-provider.json',bundleFile,...changed.map(c => c.file)]) sums.set(file, hash(fs.readFileSync(path.join(root,file))));
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums].map(([f,h])=>`${h}  ${f}`).join('\n')+'\n');
write(path.join(qa, 'prepared.json'), {bundle:nextBundle, bundleSha256:index.bundle.sha256, changed});
console.log(JSON.stringify({bundle:nextBundle, changed},null,2));
