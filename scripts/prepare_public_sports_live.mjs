// Owner-approved TEST-only preparation. This script never publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { testingKey, providerMessage, defaultsMessage, signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [source, certificationFile] = process.argv.slice(2);
if (!source || !certificationFile) throw new Error('Pass the verified ZIP and its final S2 certification JSON');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const encode = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 144 ||
    catalogue.bundleVersion !== 144 || index.signature !== '' || index.modules.length !== 42) {
  throw new Error('Unexpected TEST baseline');
}
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
const bytes = fs.readFileSync(source);
const digest = hash(bytes);
if (digest !== '41dff901e53ba0269a04b644b7a59c675dbcab4b4b40198a4b2e4040a596d094') throw new Error('Unreviewed candidate');
const manifest = JSON.parse(execFileSync('unzip', ['-p', source, 'module.json'], { encoding: 'utf8' }));
if (manifest.id !== 'public-sports-live-v1' || manifest.moduleVersion !== '0.1.0-beta.5' ||
    manifest.moduleIdentityNumber !== 111 || index.modules.some(m => m.moduleId === manifest.id || m.moduleIdentityNumber === 111)) {
  throw new Error('Unexpected or duplicate identity');
}
const certification = JSON.parse(fs.readFileSync(certificationFile, 'utf8'));
if (!['PASS', 'PARTIAL'].includes(certification.grade) || certification.profile !== 'standard' ||
    !certification.runtime?.ok || !certification.simulator?.ok ||
    certification.simulator?.fixture !== 'shared-playback-host-live' ||
    certification.simulator?.summary?.fixture !== 'shared-playback-host-live' ||
    certification.simulator?.summary?.sha256 !== digest ||
    certification.simulator?.summary?.moduleId !== manifest.id ||
    certification.simulator?.summary?.channelId !== 'FUELTV.pt@EMEA' ||
    hash(fs.readFileSync(certification.sourceZip)) !== digest) {
  throw new Error('Final ZIP has not passed native standard-profile acceptance');
}
const file = 'Public-Sports-Live-0.1.0-beta.5.zip';
const modulePath = `modules/${file}`;
const bundlePath = 'bundles/Synthetiq-Module-Bundle-145.zip';
for (const name of [modulePath, bundlePath]) if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing overwrite: ${name}`);
const keyPath = path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Unsafe key permissions');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const pub = createPublicKey(key).export({ format: 'jwk' });
if (pub.x !== testingKey.x || pub.y !== testingKey.y) throw new Error('Unexpected signing key');
const signature = message => sign('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }).toString('base64');
index.publishedAtMs = Date.now();
const presentation = { category: 'Live TV', purpose: 'Sports', language: 'English' };
const changelog = [
  'Optional TEST-only public sports IPTV trial: FIFA+ Women, FUEL TV, Red Bull TV UK, World of Freesports and SportsGrid.',
  'Adaptive broadcaster quality; schedules may include replays or studio coverage, and regional availability varies. No premium-match guarantee.',
  `S2 ${certification.grade}: native simulator sample and real runtime passed. Five feeds decoded locally; not all channels or devices are certified.`,
];
index.modules.push({ moduleId: manifest.id, moduleFamilyId: manifest.moduleFamilyId,
  moduleIdentity: manifest.moduleIdentity, moduleIdentityNumber: 111, contentType: 'video',
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
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'public-sports-bundle-'));
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
Object.assign(index.bundle, { version: 145,
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${bundlePath}`,
  sha256: hash(fs.readFileSync(path.join(root, bundlePath))), signature: '' });
Object.assign(catalogue, { bundleVersion: 145, bundleFile: bundlePath });
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
console.log('Prepared TEST Bundle 145; 42 prior modules and fallback bytes preserved. Nothing published.');
