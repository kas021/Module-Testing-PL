// Stage exact TEST candidates privately; never mutates the public index.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = '/Volumes/ZX20/.codex-worktrees/player-v9';
const Zip = require(path.join(root, 'MODULE_TESTER/node_modules/adm-zip'));
const input = path.join(root, 'dev_assets/modules/_development/playback-triage-20261111');
const output = path.join(input, 'test-sync');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const manifest = z => JSON.parse(z.getEntry('module.json').getData());
const ids = ['anikoto-v4', 'miruro-v3', 'moviedb-wiki-v1', 'synthetiq-anime-v1'];
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const feeds = {};
  for (const repo of ['Synthetiq-Modules', 'Module-Testing-PL']) {
    const response = await fetch(`https://raw.githubusercontent.com/kas021/${repo}/main/repository.json`);
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    feeds[repo] = JSON.parse(bytes);
    fs.writeFileSync(path.join(output, `${repo}.json`), bytes);
  }
  const official = feeds['Synthetiq-Modules'], test = feeds['Module-Testing-PL'];
  assert.equal(test.bundle.version, 156);
  assert.equal(test.modules.length, 45);
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, '../repository.json')));
  assert.deepEqual(test, local);
  const records = [];
  for (const id of ids) {
    const desc = official.modules.find(m => m.moduleId === id);
    const previous = test.modules.find(m => m.moduleId === id);
    const bytes = fs.readFileSync(path.join(input, 'official', `${id}.zip`));
    const oldBytes = fs.readFileSync(path.join(input, 'test', `${id}.zip`));
    assert.equal(hash(bytes), desc.sha256);
    assert.equal(hash(oldBytes), previous.sha256);
    let candidate = bytes;
    if (id === 'synthetiq-anime-v1') {
      candidate = fs.readFileSync(path.join(input, 'candidate/Synthetiq-Anime-1.0.5-beta.9.zip'));
      assert.equal(hash(candidate), '413ca29d5755d5b309f1f5beff00d3ddae5c93469a792590786d69650957c613');
    }
    const z = new Zip(candidate), old = manifest(new Zip(oldBytes)), m = manifest(z);
    for (const k of ['id', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType']) {
      assert.deepEqual(m[k], old[k], `${id}: identity ${k}`);
    }
    const fields = ['catalogueMapping', 'sourceFallbacks'];
    let changed = false;
    for (const key of fields) {
      if (old.config?.[key] !== undefined) {
        if (m.config[key] !== undefined) assert.deepEqual(m.config[key], old.config[key]);
        else { m.config[key] = old.config[key]; changed = true; }
      }
    }
    if (changed) {
      z.updateFile('module.json', Buffer.from(`${JSON.stringify(m, null, 2)}\n`));
      candidate = z.toBuffer();
    }
    const sealed = new Zip(candidate);
    assert.deepEqual(sealed.getEntries().map(e => e.entryName), z.getEntries().map(e => e.entryName));
    for (const entry of z.getEntries()) {
      if (entry.entryName !== 'module.json') assert.deepEqual(sealed.getEntry(entry.entryName).getData(), entry.getData());
    }
    const file = `${id}-${m.moduleVersion}.zip`;
    fs.writeFileSync(path.join(output, file), candidate);
    records.push({ id, previousVersion: previous.version, version: m.moduleVersion, file,
      sha256: hash(candidate), inputSha256: hash(bytes), retained: fields.filter(k => old.config?.[k] !== undefined),
      manifestOnlyMerge: changed });
  }
  fs.writeFileSync(path.join(output, 'candidates.json'), `${JSON.stringify(records, null, 2)}\n`);
  console.log(JSON.stringify(records, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
