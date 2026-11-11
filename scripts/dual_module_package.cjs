const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const overlayFields = ['catalogueMapping', 'sourceFallbacks'];
const identityFields = ['id', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType'];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function unpack(bytes) {
  const z = new Zip(bytes), entries = z.getEntries();
  assert.deepEqual(entries.map(e => e.entryName).sort(), ['index.js','module.json']);
  assert.equal(new Set(entries.map(e => e.entryName)).size, entries.length);
  return {z, manifest:JSON.parse(z.getEntry('module.json').getData()), script:z.getEntry('index.js').getData()};
}

function lanePackage(coreBytes, baselineBytes, lane) {
  assert.ok(['legacy','v9'].includes(lane));
  const core = unpack(coreBytes), baseline = unpack(baselineBytes);
  for (const m of [core.manifest,baseline.manifest]) {
    for (const key of ['id','moduleFamilyId','moduleIdentity','contentType']) assert.ok(typeof m[key]==='string' && m[key].trim(),`Missing identity: ${key}`);
    assert.ok(Number.isSafeInteger(m.moduleIdentityNumber) && m.moduleIdentityNumber>0 && m.moduleIdentityNumber<1000,'Invalid video identity number');
    assert.equal(m.contentType,'video');
    assert.ok(m.moduleIdentity.startsWith(`SP-VID-${String(m.moduleIdentityNumber).padStart(3,'0')}-`),'Identity number mismatch');
  }
  for (const key of identityFields) assert.deepEqual(core.manifest[key],baseline.manifest[key],`Identity drift: ${key}`);
  const updatedRootFields=new Set(['moduleVersion','version','releaseTrack','description','config']);
  for (const key of Object.keys(baseline.manifest)) {
    if (!updatedRootFields.has(key)) assert.deepEqual(core.manifest[key],baseline.manifest[key],`Unhandled manifest difference: ${key}`);
  }
  const manifest = structuredClone(core.manifest);
  manifest.config ||= {};
  const sharedConfigFields=new Set(['runtime','capabilities','supportsEpisodeMarkers','markerFamily','caps','baseUrl','streamHeaders','language','contentLanguage','contentRegion','contentType','presentation']);
  for (const field of Object.keys(baseline.manifest.config || {})) {
    assert.ok(field in manifest.config || overlayFields.includes(field),`Unhandled lane-specific field: ${field}`);
    if (!sharedConfigFields.has(field) && !overlayFields.includes(field)) assert.deepEqual(manifest.config[field],baseline.manifest.config[field],`Unhandled lane-specific difference: ${field}`);
  }
  for (const field of overlayFields) {
    const previous = baseline.manifest.config?.[field];
    if (lane === 'legacy') {
      if (previous === undefined) delete manifest.config[field];
      else manifest.config[field] = structuredClone(previous);
    } else if (previous !== undefined) {
      if (manifest.config[field] !== undefined) assert.deepEqual(manifest.config[field],previous,`Overlay conflict: ${field}`);
      manifest.config[field] = structuredClone(previous);
    }
  }
  let bytes = coreBytes;
  if (JSON.stringify(manifest) === JSON.stringify(baseline.manifest) && core.script.equals(baseline.script)) {
    bytes = baselineBytes;
  } else if (JSON.stringify(manifest) !== JSON.stringify(core.manifest)) {
    const output = new Zip();
    for (const [name,data] of [['index.js',core.script],['module.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n')]]) {
      output.addFile(name,data);
      output.getEntry(name).header.time = new Date('2026-01-01T00:00:00Z');
    }
    bytes = output.toBuffer();
  }
  const sealed = unpack(bytes);
  assert.deepEqual(sealed.script,core.script);
  return {bytes,manifest:sealed.manifest,sha256:digest(bytes),scriptSha256:digest(sealed.script)};
}

function stage(configFile) {
  const config = JSON.parse(fs.readFileSync(configFile));
  const rows = [];
  for (const item of config.modules) {
    const inputs = {};
    for (const key of ['core','legacy','v9']) {
      const bytes = fs.readFileSync(item[key].path);
      assert.equal(digest(bytes),item[key].sha256,`${key} input drift`);
      inputs[key] = bytes;
    }
    const core = unpack(inputs.core);
    assert.equal(core.manifest.id,item.id);
    assert.equal(core.manifest.moduleVersion,item.version);
    assert.match(item.id,/^[a-z0-9-]+$/);
    assert.match(item.version,/^[0-9A-Za-z.-]+$/);
    const row = {id:item.id,version:item.version,inputs:item,lanes:{}};
    for (const lane of ['legacy','v9']) {
      const result = lanePackage(inputs.core,inputs[lane],lane);
      const folder = path.join(config.output,lane);
      fs.mkdirSync(folder,{recursive:true});
      const file = path.join(folder,`${item.id}-${item.version}.zip`);
      if (fs.existsSync(file)) assert.equal(digest(fs.readFileSync(file)),result.sha256,'Immutable staged output differs');
      else fs.writeFileSync(file,result.bytes,{flag:'wx'});
      row.lanes[lane] = {file,sha256:result.sha256,scriptSha256:result.scriptSha256};
    }
    assert.equal(row.lanes.legacy.scriptSha256,row.lanes.v9.scriptSha256);
    rows.push(row);
  }
  fs.mkdirSync(config.output,{recursive:true});
  fs.writeFileSync(path.join(config.output,'packages.json'),JSON.stringify(rows,null,2)+'\n');
  console.log(JSON.stringify(rows.map(({id,version,lanes})=>({id,version,lanes})),null,2));
}

module.exports = {lanePackage,digest,unpack};
if (require.main === module) {
  assert.equal(process.argv.length,3,'Usage: node dual_module_package.cjs <pinned-inputs.json>');
  stage(process.argv[2]);
}
