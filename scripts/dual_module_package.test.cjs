const {test} = require('node:test');
const assert = require('node:assert/strict');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const {lanePackage,unpack} = require('./dual_module_package.cjs');
const manifest = {id:'test-v1',moduleFamilyId:'test',moduleIdentity:'SP-VID-999-TEST',moduleIdentityNumber:999,contentType:'video',moduleVersion:'1.2.3',config:{runtime:{entry:'index.js',mode:'local'}}};
const zip = (m,script='globalThis.extractStreamUrl = function(){};') => {
  const z = new Zip();
  z.addFile('module.json',Buffer.from(JSON.stringify(m)));
  z.addFile('index.js',Buffer.from(script));
  return z.toBuffer();
};
test('shared runtime bytes stay identical while TEST mappings are retained',()=>{
  const testManifest = structuredClone(manifest);
  testManifest.config.catalogueMapping = {version:1,routes:[]};
  testManifest.config.sourceFallbacks = {version:1,groups:[]};
  const core=zip(manifest), old=zip(testManifest);
  const a=lanePackage(core,core,'legacy'),b=lanePackage(core,old,'v9');
  assert.equal(a.scriptSha256,b.scriptSha256);
  assert.deepEqual(b.manifest.config.sourceFallbacks,testManifest.config.sourceFallbacks);
  assert.equal(a.manifest.config.sourceFallbacks,undefined);
  assert.deepEqual(a.bytes,core);
});
test('V9 core can backport without carrying TEST-only declarations',()=>{
  const m=structuredClone(manifest);m.config.sourceFallbacks={version:1,groups:[]};
  const result=lanePackage(zip(m),zip(manifest),'legacy');
  assert.equal(result.manifest.config.sourceFallbacks,undefined);
  assert.deepEqual(unpack(result.bytes).script,unpack(zip(m)).script);
});
test('byte-identical existing lane package is reused rather than repacked',()=>{
  const legacy=zip(manifest), m=structuredClone(manifest);
  m.config.sourceFallbacks={version:1,groups:[]};
  assert.deepEqual(lanePackage(zip(m),legacy,'legacy').bytes,legacy);
});
test('lane output is deterministic across identical runs',()=>{
  const m=structuredClone(manifest);m.config.catalogueMapping={version:2,routes:[]};
  assert.equal(lanePackage(zip(manifest),zip(m),'v9').sha256,lanePackage(zip(manifest),zip(m),'v9').sha256);
});
test('identity drift is rejected',()=>{
  const m={...manifest,moduleIdentityNumber:998,moduleIdentity:'SP-VID-998-TEST'};
  assert.throws(()=>lanePackage(zip(m),zip(manifest),'v9'),/Identity drift/);
});
test('matching absent identities cannot bypass required-field validation',()=>{
  const m=structuredClone(manifest);delete m.moduleIdentity;
  assert.throws(()=>lanePackage(zip(m),zip(m),'v9'),/Missing identity/);
});
test('unknown metadata differences fail even if the core defines the key',()=>{
  const a=structuredClone(manifest),b=structuredClone(manifest);
  a.config.verifiedIdentity={id:'a'};b.config.verifiedIdentity={id:'b'};
  assert.throws(()=>lanePackage(zip(a),zip(b),'v9'),/Unhandled lane-specific difference/);
});
test('conflicting TEST metadata fails closed',()=>{
  const a=structuredClone(manifest),b=structuredClone(manifest);
  a.config.catalogueMapping={version:1};b.config.catalogueMapping={version:2};
  assert.throws(()=>lanePackage(zip(a),zip(b),'v9'),/Overlay conflict/);
});
test('unknown lane-only metadata cannot be silently discarded',()=>{
  const m=structuredClone(manifest);m.config.preparationIdentity={verified:true};
  assert.throws(()=>lanePackage(zip(manifest),zip(m),'v9'),/Unhandled lane-specific field/);
});
test('extra or unsafe package members are rejected',()=>{
  const z=new Zip(zip(manifest));z.addFile('extra.js',Buffer.from('untrusted'));
  assert.throws(()=>unpack(z.toBuffer()));
});
