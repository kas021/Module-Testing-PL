// Owner-approved TEST-only preparation. This script never publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { testingKey, providerMessage, defaultsMessage, signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [source] = process.argv.slice(2);
if (!source) throw new Error('Pass the verified Movy ZIP');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const encode = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 145 ||
    catalogue.bundleVersion !== 145 || index.signature !== '' || index.modules.length !== 43) {
  throw new Error('Unexpected TEST baseline');
}
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
const bytes = fs.readFileSync(source);
const digest = hash(bytes);
if (digest !== 'e66f270a9b305f8102e5ed75b37f8f03a341bfde0bb27ecd1c544ecad9ba796d') throw new Error('Unreviewed candidate');
const manifest = JSON.parse(execFileSync('unzip', ['-p', source, 'module.json'], { encoding: 'utf8' }));
if (manifest.id !== 'movy-v1' || manifest.moduleVersion !== '0.1.0-beta.1' ||
    manifest.moduleIdentityNumber !== 76 || index.modules.some(m => m.moduleId === manifest.id || m.moduleIdentityNumber === 76)) {
  throw new Error('Unexpected or duplicate identity');
}
// Owner asked to publish before native simulator acceptance; the changelog says so.
const file = 'Movy-0.1.0-beta.1.zip';
const modulePath = `modules/${file}`;
const bundlePath = 'bundles/Synthetiq-Module-Bundle-146.zip';
for (const name of [modulePath, bundlePath]) if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing overwrite: ${name}`);
const keyPath = path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Unsafe key permissions');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const pub = createPublicKey(key).export({ format: 'jwk' });
if (pub.x !== testingKey.x || pub.y !== testingKey.y) throw new Error('Unexpected signing key');
const signature = message => sign('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }).toString('base64');
index.publishedAtMs = Date.now();
const presentation = { category: 'Movies & TV', purpose: 'Movies & TV', language: 'Original audio; source subtitles' };
const changelog = [
  'New TEST source: movies and TV from movy.sx (TMDB catalogue). Original-audio servers up to 4K with source subtitles; matching Hindi/Spanish/French/German servers for films in those languages, and labelled dubbed servers only when no original audio exists.',
  'Coverage: 45 of 48 varied movies resolved (median 5 s); the 3 misses are not available on movy.sx itself. The site rate-limits stream requests; on a limit the module asks you to wait about two minutes.',
  'Real Flutter runtime and S2 media/language checks passed (English audio and subtitles confirmed). Native iOS Simulator and device playback have NOT been run yet.',
];
index.modules.push({ moduleId: manifest.id, moduleFamilyId: manifest.moduleFamilyId,
  moduleIdentity: manifest.moduleIdentity, moduleIdentityNumber: 76, contentType: 'video',
  version: manifest.moduleVersion, minAppVersion: '9.0.91',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${modulePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${modulePath}`, sha256: digest, signature: '',
  publishedAtMs: index.publishedAtMs, presentation, changelog });
catalogue.modules.push({ file: modulePath, presentation, changelog });
for (const provider of index.subtitleProviders || []) provider.signature = signature(providerMessage(index, provider));
if (index.defaultModules) index.defaultModulesSignature = signature(defaultsMessage(index));
if (index.subtitleProviders?.length !== 1) throw new Error('Unexpected provider list');
const provider = { schemaVersion: index.schemaVersion, repositoryId: index.repositoryId,
  publishedAtMs: index.publishedAtMs, provider: index.subtitleProviders[0] };
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'movy-bundle-'));
try {
  execFileSync('unzip', ['-q', path.join(root, catalogue.bundleFile), '-d', stage]);
  const preserved = new Map(fs.readdirSync(stage).filter(n => n !== 'synthetiq-subtitles.provider.json')
    .map(n => [n, hash(fs.readFileSync(path.join(stage, n)))]));
  fs.writeFileSync(path.join(stage, file), bytes, { flag: 'wx' });
  fs.writeFileSync(path.join(stage, 'synthetiq-subtitles.provider.json'), encode(provider));
  execFileSync('zip', ['-q', path.join(root, bundlePath), ...fs.readdirSync(stage).sort()], { cwd: stage });
  for (const [name, oldDigest] of preserved) {
    if (hash(execFileSync('unzip', ['-p', path.join(root, bundlePath), name], { maxBuffer: 64 * 1024 * 1024 })) !== oldDigest) {
      throw new Error(`Unrelated bundle entry changed: ${name}`);
    }
  }
} finally { fs.rmSync(stage, { recursive: true, force: true }); }
fs.writeFileSync(path.join(root, modulePath), bytes, { flag: 'wx' });
Object.assign(index.bundle, { version: 146,
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${bundlePath}`,
  sha256: hash(fs.readFileSync(path.join(root, bundlePath))), signature: '' });
Object.assign(catalogue, { bundleVersion: 146, bundleFile: bundlePath });
index.testingIdentity = index.modules.map(m => `${m.moduleId}:${m.version}:${m.sha256}`).join('|');
const catalogueBytes = encode(catalogue);
if (index.catalogueSha256) index.catalogueSha256 = hash(catalogueBytes);
if (index.catalogue?.sha256) index.catalogue.sha256 = hash(catalogueBytes);
const errors = signatureErrors(index, { allowCommunityIndex: true });
if (errors.length) throw new Error(errors.join('\n'));
for (const [name, data] of [['catalogue.json', catalogueBytes], ['repository.json', encode(index)], ['subtitle-provider.json', encode(provider)]]) {
  fs.writeFileSync(path.join(root, name), data);
}
const sums = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map(line => {
  const m = /^([a-f0-9]{64})\s+(.+)$/.exec(line);
  if (!m) throw new Error('Invalid checksums');
  return [m[2], m[1]];
}));
for (const name of [modulePath, bundlePath, 'catalogue.json', 'repository.json', 'subtitle-provider.json']) sums.set(name, hash(fs.readFileSync(path.join(root, name))));
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums].map(([name, digest]) => `${digest}  ${name}`).join('\n') + '\n');
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
console.log('Prepared TEST Bundle 146; 43 prior modules and fallback bytes preserved. Nothing published.');
