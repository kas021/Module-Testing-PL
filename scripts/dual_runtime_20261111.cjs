const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const app = '/Volumes/ZX20/.codex-worktrees/player-v9';
const legacy = '/Volumes/ZX20/.codex-worktrees/trio-8.6-verification-20260926';
const qa = path.join(app,'dev_assets/modules/_development/dual-maintenance-20261111');
const revision = 'aaee1e1b4c59b3683e13ecf88d761ec947281ecd';
const [lane,id,query,lang,overrideZip] = process.argv.slice(2);
assert.ok(['legacy','v9'].includes(lane));
assert.equal(lane,'v9','Current owner scope is V9 only; legacy runtime work is paused');
assert.ok(['sub','dub'].includes(lang));
const packages = JSON.parse(fs.readFileSync(path.join(qa,'packages/packages.json')));
const info = packages.find(p=>p.id===id);
assert.ok(info || overrideZip);
const zip = overrideZip || info.lanes[lane].file;
assert.ok(fs.realpathSync(zip).startsWith(qa+path.sep),'Candidate outside private module QA');
const bytes = fs.readFileSync(zip),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
const Zip=require(path.join(app,'MODULE_TESTER/node_modules/adm-zip'));
const manifest=JSON.parse(new Zip(bytes).getEntry('module.json').getData());
assert.equal(manifest.id,id);
if (!overrideZip) assert.equal(sha256,info.lanes[lane].sha256);
let root = app;
if (lane==='legacy') {
  root = path.join(qa,'runtime-8.6.7');
  if (!fs.existsSync(path.join(root,'SNAPSHOT.json'))) {
    fs.mkdirSync(path.join(root,'.dart_tool'),{recursive:true});
    const archive = cp.execFileSync('git',['archive',revision,'lib','test/module_app_runtime_test.dart','pubspec.yaml','pubspec.lock'],{cwd:app,maxBuffer:128*1024*1024});
    cp.execFileSync('tar',['-xf','-','-C',root],{input:archive});
    const configPath=path.join(legacy,'.dart_tool/package_config.json');
    const config=JSON.parse(fs.readFileSync(configPath));
    for(const p of config.packages) p.rootUri=p.name==='synthetiq_player'?pathToFileURL(root+'/').href:new URL(p.rootUri,pathToFileURL(configPath)).href;
    fs.writeFileSync(path.join(root,'.dart_tool/package_config.json'),JSON.stringify(config));
    fs.copyFileSync(path.join(legacy,'.dart_tool/package_graph.json'),path.join(root,'.dart_tool/package_graph.json'));
    for(const directory of ['assets','third_party']) if(fs.existsSync(path.join(legacy,directory))) fs.symlinkSync(path.join(legacy,directory),path.join(root,directory),'dir');
    fs.writeFileSync(path.join(root,'SNAPSHOT.json'),JSON.stringify({revision,dependenciesFrom:legacy,currentFlutter:true}));
  }
}
const startedAt=new Date().toISOString(),run=startedAt.replace(/[:.]/g,'-')+'_'+lane+'_'+id+'_'+lang;
const out=path.join(qa,'runtime',run);fs.mkdirSync(out,{recursive:true});
const result=cp.spawnSync('flutter',['test','--no-pub','--concurrency=1','test/module_app_runtime_test.dart',
  `--dart-define=MODULE_ZIP=${zip}`,`--dart-define=MODULE_QUERY=${query}`,`--dart-define=MODULE_LANG=${lang}`,
  '--dart-define=MODULE_CHECK_DOWNLOAD=true'],{cwd:root,encoding:'utf8',timeout:240000,maxBuffer:16*1024*1024});
const log=(result.stdout||'')+'\n'+(result.stderr||'');
fs.writeFileSync(path.join(out,'runtime.log'),log);
const marker='MODULE_APP_RUNTIME_SUMMARY ',at=log.lastIndexOf(marker);
let summary=null;
try{if(at>=0)summary=JSON.parse(log.slice(at+marker.length).split(/\r?\n/)[0]);}catch{}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
const receipt={lane,id,version:manifest.moduleVersion,query,lang,zip,sha256,sourceRevision:lane==='legacy'?revision:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:app,encoding:'utf8'}).trim(),
  startedAt,finishedAt:new Date().toISOString(),exitCode:result.status,error:result.error?.message,
  grade:result.status===0&&summary?'PASS':'FAIL',steps:summary?Object.fromEntries(Object.entries(summary).filter(([,v])=>v&&typeof v==='object'&&'ok' in v).map(([k,v])=>[k,{ok:v.ok,durationMs:v.durationMs,error:v.error}])):{},
  evidence:out,sourceSnapshotOnly:lane==='legacy'};
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));process.exitCode=receipt.grade==='PASS'?0:1;
