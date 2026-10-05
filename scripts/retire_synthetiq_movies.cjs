'use strict';
// One-off, guarded retirement; historical packages remain available for rollback.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const write = (file, data) => fs.writeFileSync(path.join(root,file), JSON.stringify(data,null,2)+'\n');
const index=read('repository.json'), catalogue=read('catalogue.json');
assert.equal(index.repositoryId,'module-testing-pl');
assert.equal(catalogue.repositoryId,'module-testing-pl');
assert.equal(index.bundle.version,133);
assert.equal(catalogue.bundleVersion,133);
const retired=index.modules.filter(m=>m.moduleId==='synthetiq-movies-v1');
assert.equal(retired.length,1);
const relative=retired[0].packageUrl.split('/main/')[1];
assert.equal(catalogue.modules.filter(m=>m.file===relative).length,1);
const previous=new Map(index.modules.map(m=>[m.moduleId,JSON.stringify(m)]));
index.modules=index.modules.filter(m=>m.moduleId!=='synthetiq-movies-v1');
catalogue.modules=catalogue.modules.filter(m=>m.file!==relative);
const bundle='bundles/Synthetiq-Module-Bundle-134.zip';
assert.ok(!fs.existsSync(path.join(root,bundle)),'Never overwrite an existing bundle');
execFileSync('zip',['-q','-j',path.join(root,bundle),...catalogue.modules.map(m=>path.join(root,m.file))]);
const now=Date.now();
catalogue.bundleVersion=134;
catalogue.bundleFile=bundle;
Object.assign(index.bundle,{version:134,packageUrl:'https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/'+bundle,
  packagePath:'/kas021/Module-Testing-PL/main/'+bundle,sha256:digest(bundle)});
index.publishedAtMs=now;
index.testingIdentity=index.modules.map(m=>[m.moduleId,m.version,m.sha256].join(':')).join('|');
write('catalogue.json',catalogue);
if (index.catalogueSha256) index.catalogueSha256=digest('catalogue.json');
if (index.catalogue?.sha256) index.catalogue.sha256=digest('catalogue.json');
write('repository.json',index);
const files=fs.readFileSync(path.join(root,'SHA256SUMS'),'utf8').trim().split('\n').map(l=>l.trim().split(/\s+/,2)[1].replace(/^\*/,''));
if (!files.includes(bundle)) files.push(bundle);
fs.writeFileSync(path.join(root,'SHA256SUMS'),files.map(f=>digest(f)+'  '+f+'\n').join(''));
for(const m of index.modules) assert.equal(JSON.stringify(m),previous.get(m.moduleId));
for(const m of catalogue.modules) {
  const bytes=execFileSync('unzip',['-p',path.join(root,bundle),path.basename(m.file)]);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),digest(m.file));
}
assert.ok(index.modules.some(m=>m.moduleId==='streamingunity-v1'));
console.log('TEST bundle 134: retired only Synthetiq Movies; '+index.modules.length+' unchanged packages verified');
