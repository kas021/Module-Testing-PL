// Exercise historical import code in disposable package roots, not app worktrees.
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const cp = require('node:child_process');
const v9 = '/Volumes/ZX20/.codex-worktrees/player-v9';
const repository = path.resolve(__dirname, '..');
const output = path.join(v9, 'dev_assets/modules/_development/playback-triage-20261111/test-sync/legacy');
const configPath = path.join(v9, '.dart_tool/package_config.json');
const results = [];
for (const [version, revision] of [['9.0.0','575943a6'],['9.0.55','0e925ffd'],['9.0.81','bab2adbd']]) {
  const root = path.join(output, version);
  fs.mkdirSync(root,{recursive:true});
  fs.mkdirSync(path.join(root,'.dart_tool'),{recursive:true});
  fs.copyFileSync(path.join(v9,'.dart_tool/package_graph.json'),path.join(root,'.dart_tool/package_graph.json'));
  for (const file of ['pubspec.yaml','pubspec.lock']) fs.copyFileSync(path.join(v9,file),path.join(root,file));
  for (const directory of ['assets','packages']) {
    const target = path.join(root,directory);
    if (fs.existsSync(path.join(v9,directory)) && !fs.existsSync(target)) fs.symlinkSync(path.join(v9,directory),target,'dir');
  }
  const archive = cp.execFileSync('git',['archive',revision,'lib'],{cwd:v9,maxBuffer:128*1024*1024});
  cp.execFileSync('tar',['-xf','-','-C',root],{input:archive});
  const config = JSON.parse(fs.readFileSync(configPath));
  for (const p of config.packages) {
    p.rootUri = p.name === 'synthetiq_player' ? pathToFileURL(root+'/').href : new URL(p.rootUri,pathToFileURL(configPath)).href;
  }
  const isolatedConfig = path.join(root,'.dart_tool/package_config.json');
  fs.writeFileSync(isolatedConfig,JSON.stringify(config));
  const fixture = path.join(root,'historical_import_test.dart');
  fs.copyFileSync(path.join(v9,'test/fixtures/v9_historical_import.dart'),fixture);
  const result = cp.spawnSync('flutter',['test','--no-pub','--concurrency=1',
    `--packages=${isolatedConfig}`,fixture],{
    cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,
    env:{...process.env,V9_HISTORICAL_REPOSITORY_ROOT:repository,V9_HISTORICAL_APP_VERSION:version,V9_HISTORICAL_REVISION:revision},
  });
  const log = path.join(root,'flutter-test.log');
  if (fs.existsSync(log)) fs.renameSync(log,path.join(root,`flutter-test-prior-${Date.now()}.log`));
  fs.writeFileSync(log,result.stdout+'\n'+result.stderr);
  results.push({version,revision,exitCode:result.status,error:result.error?.message,
    result:result.status===0?'PASS':'FAIL',log:path.join(root,'flutter-test.log')});
  console.log(JSON.stringify(results.at(-1)));
}
fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2)+'\n');
process.exitCode = results.every(r=>r.exitCode===0)?0:1;
