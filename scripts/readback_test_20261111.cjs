const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const v9 = '/Volumes/ZX20/.codex-worktrees/player-v9';
const Zip = require(path.join(v9, 'MODULE_TESTER/node_modules/adm-zip'));
const qa = path.join(v9, 'dev_assets/modules/_development/playback-triage-20261111/test-sync');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const prefix = 'https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/';
async function get(relative) {
  assert.ok(!relative.includes('..') && !relative.includes('?') && !relative.includes('#'));
  const response = await fetch(prefix + relative, {signal:AbortSignal.timeout(60000)});
  assert.equal(response.status, 200, `${relative}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
(async () => {
  const expected = fs.readFileSync(path.join(root,'repository.json'));
  let bytes;
  for (let attempt=0; attempt<31; attempt++) {
    bytes = await get('repository.json');
    if (hash(bytes) === hash(expected)) break;
    console.log(`Query-free feed propagation pending, attempt ${attempt+1}`);
    if (attempt === 30) throw new Error('Public main feed has not propagated');
    await new Promise(resolve => setTimeout(resolve,20000));
  }
  const index = JSON.parse(bytes);
  const {signatureErrors} = await import('./repository_signatures.mjs');
  assert.deepEqual(signatureErrors(index,{allowCommunityIndex:true}),[]);
  const receipt = {verifiedAt:new Date().toISOString(), queryFree:true,
    bundleVersion:index.bundle.version, modules:index.modules.length,
    indexSha256:hash(bytes), files:{'repository.json':hash(bytes)}};
  const bundleRelative = index.bundle.packageUrl.slice(prefix.length);
  const bundle = await get(bundleRelative);
  assert.equal(hash(bundle), index.bundle.sha256);
  receipt.files[bundleRelative] = hash(bundle);
  const zip = new Zip(bundle), members = zip.getEntries();
  assert.equal(members.length,index.modules.length+1);
  assert.equal(new Set(members.map(e=>e.entryName)).size,members.length);
  for (const m of index.modules) {
    const entry = zip.getEntry(decodeURIComponent(new URL(m.packageUrl).pathname.split('/').pop()));
    assert.ok(entry);
    assert.equal(hash(entry.getData()),m.sha256);
  }
  const prepared = JSON.parse(fs.readFileSync(path.join(qa,'prepared.json')));
  for (const file of ['catalogue.json','subtitle-provider.json','SHA256SUMS',...prepared.changed.map(c=>c.file)]) {
    const data = await get(file);
    assert.equal(hash(data),hash(fs.readFileSync(path.join(root,file))),file);
    receipt.files[file] = hash(data);
  }
  const envelope = JSON.parse(zip.getEntry('synthetiq-subtitles.provider.json').getData());
  assert.equal(envelope.publishedAtMs,index.publishedAtMs);
  assert.deepEqual(envelope.provider,index.subtitleProviders[0]);
  receipt.changed = prepared.changed;
  receipt.bundleMembersVerified = members.length;
  fs.writeFileSync(path.join(qa,'public-readback.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
