import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import { supersedesCandidate, assertTestingCapacity } from './release-policy.mjs';
process.chdir(path.resolve(import.meta.dirname, '..'));
const stable = await fetch('https://raw.githubusercontent.com/kas021/Synthetiq-Modules/main/repository.json', {signal: AbortSignal.timeout(20000)});
if (!stable.ok) throw new Error(`Stable index HTTP ${stable.status}`);
const official = await stable.json();
if (!Array.isArray(official.modules) || !official.modules.length) throw new Error('Invalid stable index');
// Keep old immutable package URLs reachable without listing them as active.
const retired = fs.existsSync('retired-packages.json') ? JSON.parse(fs.readFileSync('retired-packages.json')) : [];
if (!Array.isArray(retired) || retired.some(x => typeof x !== 'string' || path.basename(x) !== x || !x.endsWith('.zip'))) throw new Error('Invalid retired package list');
const files = fs.readdirSync('modules').filter(x => x.endsWith('.zip') && !retired.includes(x));
const candidates = files.map(file => ({file, manifest: JSON.parse(execFileSync('unzip', ['-p', `modules/${file}`, 'module.json'], {encoding:'utf8'}))}));
// A stable release also retires earlier betas of the same module.
const active = candidates.filter(({file,manifest:m}) => {
  if (!official.modules.some(x => x.moduleId === m.id && supersedesCandidate(x.version, m.moduleVersion))) return true;
  fs.mkdirSync('_module_history', {recursive:true});
  fs.copyFileSync(`modules/${file}`, `_module_history/${file}`, fs.constants.COPYFILE_EXCL);
  fs.unlinkSync(`modules/${file}`);
  return false;
});
assertTestingCapacity(active.map(x => x.manifest));
if (new Set(active.map(x => x.manifest.id)).size !== active.length) throw new Error('Duplicate module');
const previous = fs.existsSync('repository.json') ? JSON.parse(fs.readFileSync('repository.json')) : null;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const identity = active.map(x => `${x.manifest.id}:${x.manifest.moduleVersion}:${hash(`modules/${x.file}`)}`).join('|');
if (previous && previous.testingIdentity === identity) process.exit(0);
const version = (previous?.bundle.version ?? 0) + 1;
const publishedAtMs = Date.now();
const base = 'https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/';
const info = file => ({packageUrl:base+file, packagePath:new URL(base+file).pathname, sha256:hash(file), signature:'', minAppVersion:'8.5.33'});
fs.mkdirSync('bundles', {recursive:true});
const bundleFile = `bundles/Testing-${version}.zip`;
if (active.length) execFileSync('zip', ['-j', bundleFile, ...active.map(x => `modules/${x.file}`)]);
else {
  // Older Player versions reject empty repositories. Keep no released packages available.
  fs.writeFileSync(bundleFile, Buffer.from('504b0506000000000000000000000000000000000000','hex'));
}
const modules = active.map(({file,manifest:m}) => ({
  moduleId:m.id, moduleFamilyId:m.moduleFamilyId, moduleIdentity:m.moduleIdentity,
  moduleIdentityNumber:m.moduleIdentityNumber, contentType:m.contentType,
  version:m.moduleVersion, ...info(`modules/${file}`), publishedAtMs,
  presentation:{...previous?.modules?.find(x => x.moduleId === m.id)?.presentation,
    ...m.presentation,recommended:false,
    purpose:m.qaFixture === 'intentional-playback-failure' ? 'QA only: playback deliberately fails' : 'Testing only'},
  changelog:[m.qaFixture === 'intentional-playback-failure'
    ? 'Intentional failure fixture: One Piece episode 1. No video is provided. Test Try another source in Player 8.5.55+117.'
    : 'TEST CANDIDATE: not certified for stable release. See repository QA notes.'],
}));
fs.writeFileSync('repository.json', JSON.stringify({schemaVersion:1,repositoryId:'module-testing-pl',name:'Module Testing PL',enabled:!!active.length,publishedAtMs,signature:'',testingIdentity:identity,bundle:{version,...info(bundleFile)},modules},null,2)+'\n');
// Retain immutable previous bundles so cached indexes do not encounter a 404.
console.log(`Published index for ${modules.length} testing candidates`);
