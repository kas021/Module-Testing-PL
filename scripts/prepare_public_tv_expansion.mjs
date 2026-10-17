// TEST-only update preparation; never pushes or publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash,createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {testingKey,providerMessage,defaultsMessage,signatureErrors} from './repository_signatures.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [sourceArg,certArg]=process.argv.slice(2);
if (!sourceArg || !certArg) throw Error('Pass candidate ZIP and exact standard S2 certification');
const source=path.resolve(sourceArg);
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const encode=value=>JSON.stringify(value,null,2)+'\n';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(file,args)=>execFileSync(file,args,{maxBuffer:64*1024*1024});
const index=read('repository.json'), catalogue=read('catalogue.json');
if(index.repositoryId!=='module-testing-pl' || index.bundle.version!==148 || catalogue.bundleVersion!==148 ||
   index.signature!=='' || index.modules.length!==45 || catalogue.modules.length!==45) throw Error('Expected TEST Bundle 148 with 45 modules');
execFileSync(process.execPath,[path.join(root,'scripts/verify_repository.mjs')],{stdio:'inherit'});
const bytes=fs.readFileSync(source), digest=hash(bytes);
const manifest=JSON.parse(run('unzip',['-p',source,'module.json']));
const oldFile='Public-TV-Live-0.1.0-beta.2.zip';
const entry=index.modules.find(m=>m.moduleId==='public-tv-live-v1');
const catEntry=catalogue.modules.find(m=>m.file===`modules/${oldFile}`);
if(!entry || !catEntry || entry.version!=='0.1.0-beta.2' || manifest.id!==entry.moduleId ||
   manifest.moduleIdentityNumber!==113 || manifest.moduleIdentity!==entry.moduleIdentity ||
   manifest.moduleFamilyId!==entry.moduleFamilyId || manifest.moduleVersion!=='0.1.0-beta.4') throw Error('Unexpected candidate identity/version');
const cert=JSON.parse(fs.readFileSync(path.resolve(certArg),'utf8')), sim=cert.simulator;
if(cert.grade!=='PASS' || cert.profile!=='standard' || cert.runtime?.ok!==true || sim?.ok!==true ||
   sim.fixture!=='shared-playback-host-live' || sim.summary?.fixture!==sim.fixture ||
   sim.summary?.moduleId!==manifest.id || sim.summary?.sha256!==digest ||
   !cert.sourceZip || hash(fs.readFileSync(cert.sourceZip))!==digest) throw Error('Exact standard S2 PASS required');
const file='Public-TV-Live-0.1.0-beta.4.zip', modulePath=`modules/${file}`;
const bundlePath='bundles/Synthetiq-Module-Bundle-149.zip';
for(const name of [modulePath,bundlePath]) if(fs.existsSync(path.join(root,name))) throw Error('Refusing overwrite');
const metadataNames=['repository.json','catalogue.json','subtitle-provider.json','SHA256SUMS'];
const originalMetadata=new Map(metadataNames.map(name=>{
  const target=path.join(root,name),stat=fs.lstatSync(target);
  if(!stat.isFile() || stat.isSymbolicLink()) throw Error(`Refusing non-regular metadata file: ${name}`);
  return [name,{bytes:fs.readFileSync(target),mode:stat.mode & 0o777}];
}));
const originalModules=encode(index.modules.filter(m=>m!==entry));
const originalCatalogue=encode(catalogue.modules.filter(m=>m!==catEntry));
const originalDefaults=encode(index.defaultModules);
const expectedMembers=catalogue.modules.map(m=>path.basename(m.file)).concat('synthetiq-subtitles.provider.json').sort();
const keyPath=path.join(os.homedir(),'.config/synthetiq/module-testing-signing.jwk');
if((fs.statSync(keyPath).mode & 0o077)!==0) throw Error('Unsafe key permissions');
const key=createPrivateKey({key:JSON.parse(fs.readFileSync(keyPath)),format:'jwk'});
const pub=createPublicKey(key).export({format:'jwk'});
if(pub.x!==testingKey.x || pub.y!==testingKey.y) throw Error('Unexpected signing key');
const signature=message=>sign('sha256',Buffer.from(message),{key,dsaEncoding:'ieee-p1363'}).toString('base64');
index.publishedAtMs=Date.now();
const changelog=[
  'Expanded active-only public TV selection after two bounded decodes and fresh module live-playlist checks. Failed and unverified candidates remain hidden.',
  'Sports channels may broadcast replays or news; no guarantee that a live football or cricket match is currently on air. Regional availability varies.',
  'Exact package passed S2 standard native simulator playback. Physical-device and all-region acceptance are separate.',
];
Object.assign(entry,{version:manifest.moduleVersion,sha256:digest,signature:'',publishedAtMs:index.publishedAtMs,
  packageUrl:`https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${modulePath}`,
  packagePath:`/kas021/Module-Testing-PL/main/${modulePath}`,changelog});
Object.assign(catEntry,{file:modulePath,changelog});
if(originalModules!==encode(index.modules.filter(m=>m!==entry)) ||
   originalCatalogue!==encode(catalogue.modules.filter(m=>m!==catEntry)) ||
   originalDefaults!==encode(index.defaultModules)) throw Error('Unrelated declarations changed');
if(index.subtitleProviders?.length!==1) throw Error('Unexpected providers');
for(const p of index.subtitleProviders) p.signature=signature(providerMessage(index,p));
if(index.defaultModules) index.defaultModulesSignature=signature(defaultsMessage(index));
const provider={schemaVersion:index.schemaVersion,repositoryId:index.repositoryId,
  publishedAtMs:index.publishedAtMs,provider:index.subtitleProviders[0]};
const stage=fs.mkdtempSync(path.join(path.dirname(root),'.public-tv-expansion-'));
const stageRoot=path.join(stage,'repository');
const promotedOutputs=[],promotedMetadata=[];
let keepStageForRecovery=false;
const removeOwnedOutput=(target,expectedHash,errors)=>{
  if(!fs.existsSync(target)) return;
  try {
    if(hash(fs.readFileSync(target))!==expectedHash) throw Error(`Refusing to remove changed output ${path.relative(root,target)}`);
    fs.unlinkSync(target);
  } catch(error) { errors.push(error.message); }
};
const restoreMetadata=(name,errors)=>{
  const original=originalMetadata.get(name),target=path.join(root,name);
  try {
    const backup=path.join(stage,`restore-${name.replace(/[^a-z0-9]/gi,'_')}`);
    fs.writeFileSync(backup,original.bytes,{flag:'wx',mode:original.mode});
    fs.chmodSync(backup,original.mode);
    fs.renameSync(backup,target);
  } catch(error) { errors.push(`Could not restore ${name}: ${error.message}`); }
};
try {
  fs.mkdirSync(stageRoot);
  fs.cpSync(root,stageRoot,{recursive:true,filter:source=>
    source!==stage && !source.startsWith(`${stage}${path.sep}`)});
  const bundleStage=path.join(stage,'bundle-input');
  fs.mkdirSync(bundleStage);
  run('unzip',['-q',path.join(stageRoot,catalogue.bundleFile),'-d',bundleStage]);
  if(encode(fs.readdirSync(bundleStage).sort())!==encode(expectedMembers)) throw Error('Unexpected baseline bundle members');
  const preserved=new Map(expectedMembers.filter(n=>![oldFile,'synthetiq-subtitles.provider.json'].includes(n))
    .map(n=>[n,hash(fs.readFileSync(path.join(bundleStage,n)))]));
  fs.unlinkSync(path.join(bundleStage,oldFile));
  fs.writeFileSync(path.join(bundleStage,file),bytes,{flag:'wx'});
  fs.writeFileSync(path.join(bundleStage,'synthetiq-subtitles.provider.json'),encode(provider));
  fs.mkdirSync(path.dirname(path.join(stageRoot,bundlePath)),{recursive:true});
  execFileSync('zip',['-q',path.join(stageRoot,bundlePath),...fs.readdirSync(bundleStage).sort()],{cwd:bundleStage});
  for(const [name,oldHash] of preserved) if(hash(run('unzip',['-p',path.join(stageRoot,bundlePath),name]))!==oldHash) throw Error('Unrelated ZIP changed');
  if(run('unzip',['-p',path.join(stageRoot,bundlePath),'synthetiq-subtitles.provider.json']).toString()!==encode(provider)) throw Error('Provider mismatch');
  fs.mkdirSync(path.dirname(path.join(stageRoot,modulePath)),{recursive:true});
  fs.writeFileSync(path.join(stageRoot,modulePath),bytes,{flag:'wx'});

  Object.assign(index.bundle,{version:149,sha256:hash(fs.readFileSync(path.join(stageRoot,bundlePath))),signature:'',
    packageUrl:`https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
    packagePath:`/kas021/Module-Testing-PL/main/${bundlePath}`});
  Object.assign(catalogue,{bundleVersion:149,bundleFile:bundlePath});
  index.testingIdentity=index.modules.map(m=>`${m.moduleId}:${m.version}:${m.sha256}`).join('|');
  const catalogueBytes=encode(catalogue);
  if(index.catalogueSha256) index.catalogueSha256=hash(catalogueBytes);
  if(index.catalogue?.sha256) index.catalogue.sha256=hash(catalogueBytes);
  const errors=signatureErrors(index,{allowCommunityIndex:true});
  if(errors.length) throw Error(errors.join('\n'));
  const stagedMetadata=new Map([
    ['repository.json',encode(index)],['catalogue.json',catalogueBytes],['subtitle-provider.json',encode(provider)],
  ]);
  const sums=new Map(fs.readFileSync(path.join(stageRoot,'SHA256SUMS'),'utf8').trim().split('\n').map(line=>{
    const m=/^([a-f0-9]{64})\s+(.+)$/.exec(line);if(!m)throw Error('Invalid checksums');return[m[2],m[1]];
  }));
  for(const name of [modulePath,bundlePath,...stagedMetadata.keys()]) {
    const stagedFile=path.join(stageRoot,name);
    if(stagedMetadata.has(name)) fs.writeFileSync(stagedFile,stagedMetadata.get(name));
    sums.set(name,hash(fs.readFileSync(stagedFile)));
  }
  stagedMetadata.set('SHA256SUMS',[...sums].map(([n,h])=>`${h}  ${n}`).join('\n')+'\n');
  for(const [name,data] of stagedMetadata) fs.writeFileSync(path.join(stageRoot,name),data);
  execFileSync(process.execPath,[path.join(stageRoot,'scripts/verify_repository.mjs'),'--root',stageRoot],{stdio:'inherit'});

  for(const name of [modulePath,bundlePath]) if(fs.existsSync(path.join(root,name))) throw Error(`Refusing overwrite during promotion: ${name}`);
  for(const name of metadataNames) {
    if(!fs.readFileSync(path.join(root,name)).equals(originalMetadata.get(name).bytes)) throw Error(`Metadata changed during preparation: ${name}`);
  }
  for(const name of [modulePath,bundlePath]) {
    const stagedFile=path.join(stageRoot,name),target=path.join(root,name);
    fs.linkSync(stagedFile,target);
    promotedOutputs.push({target,expectedHash:hash(fs.readFileSync(stagedFile))});
  }
  for(const name of metadataNames) {
    fs.renameSync(path.join(stageRoot,name),path.join(root,name));
    promotedMetadata.push(name);
  }
} catch(error) {
  const rollbackErrors=[];
  for(const name of promotedMetadata.reverse()) restoreMetadata(name,rollbackErrors);
  for(const output of promotedOutputs.reverse()) removeOwnedOutput(output.target,output.expectedHash,rollbackErrors);
  if(rollbackErrors.length) {
    keepStageForRecovery=true;
    throw Error(`${error.message}\nRollback issues:\n${rollbackErrors.join('\n')}\nRecovery files retained at ${stage}`);
  }
  throw error;
} finally {if(!keepStageForRecovery) fs.rmSync(stage,{recursive:true,force:true});}
console.log('Prepared TEST Bundle 149; 44 unrelated modules preserved. Nothing published.');
