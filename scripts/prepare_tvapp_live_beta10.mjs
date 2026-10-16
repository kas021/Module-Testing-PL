// Owner-approved TEST-only update. Preparation never publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { testingKey, providerMessage, defaultsMessage, signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Pass the verified beta.10 ZIP');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const encode = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 143 ||
    catalogue.bundleVersion !== 143 || index.signature !== '') throw new Error('Unexpected TEST baseline');
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
const bytes = fs.readFileSync(source);
if (hash(bytes) !== '53ad7b27f4723e4f9e1286891e614ccbd64ac0477879a75f6ba30fbc0cc1c0a5') throw new Error('Unreviewed candidate');
const manifest = JSON.parse(execFileSync('unzip', ['-p', source, 'module.json'], { encoding: 'utf8' }));
const entry = index.modules.find(m => m.moduleId === 'tvapp-live-v1');
const oldFile = 'TVApp-Live-0.1.0-beta.8.zip';
const catEntry = catalogue.modules.find(m => m.file === `modules/${oldFile}`);
if (!entry || !catEntry || entry.version !== '0.1.0-beta.8' || manifest.moduleIdentityNumber !== 81 ||
    manifest.id !== entry.moduleId || manifest.moduleVersion !== '0.1.0-beta.10') throw new Error('Identity mismatch');
const file = 'TVApp-Live-0.1.0-beta.10.zip';
const modulePath = `modules/${file}`;
const bundlePath = 'bundles/Synthetiq-Module-Bundle-144.zip';
for (const name of [modulePath, bundlePath]) if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing overwrite: ${name}`);
const keyPath = path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Unsafe key permissions');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const pub = createPublicKey(key).export({ format: 'jwk' });
if (pub.x !== testingKey.x || pub.y !== testingKey.y) throw new Error('Unexpected signing key');
const signature = message => sign('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }).toString('base64');
index.publishedAtMs = Date.now();
const changelog = [
  'TEST-only cricket update for Player 9.0.91. Willow passed the actual native V9 Live player: sustained playback, pause/resume and fresh Go Live.',
  'Supports validated wrapped Live video; removes false off-air detection based on image filenames. Broadcasts can include replays. General S2 Willow journey still fails outside the native path; no all-channel or Android certification.',
];
Object.assign(entry, { version: manifest.moduleVersion, minAppVersion: '9.0.91',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${modulePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${modulePath}`, sha256: hash(bytes),
  signature: '', publishedAtMs: index.publishedAtMs, changelog });
Object.assign(catEntry, { file: modulePath, changelog });
for (const provider of index.subtitleProviders || []) provider.signature = signature(providerMessage(index, provider));
if (index.defaultModules) index.defaultModulesSignature = signature(defaultsMessage(index));
if (index.subtitleProviders?.length !== 1) throw new Error('Unexpected provider list');
const provider = { schemaVersion: index.schemaVersion, repositoryId: index.repositoryId,
  publishedAtMs: index.publishedAtMs, provider: index.subtitleProviders[0] };
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'tvapp-cricket-bundle-'));
try {
  execFileSync('unzip', ['-q', path.join(root, catalogue.bundleFile), '-d', stage]);
  const preserved = new Map(fs.readdirSync(stage).filter(n => ![oldFile, 'synthetiq-subtitles.provider.json'].includes(n))
    .map(n => [n, hash(fs.readFileSync(path.join(stage, n)))]));
  fs.unlinkSync(path.join(stage, oldFile));
  fs.writeFileSync(path.join(stage, file), bytes, { flag: 'wx' });
  fs.writeFileSync(path.join(stage, 'synthetiq-subtitles.provider.json'), encode(provider));
  execFileSync('zip', ['-q', path.join(root, bundlePath), ...fs.readdirSync(stage).sort()], { cwd: stage });
  for (const [name, digest] of preserved) {
    if (hash(execFileSync('unzip', ['-p', path.join(root, bundlePath), name], { maxBuffer: 64 * 1024 * 1024 })) !== digest) {
      throw new Error(`Unrelated bundle entry changed: ${name}`);
    }
  }
} finally { fs.rmSync(stage, { recursive: true, force: true }); }
fs.writeFileSync(path.join(root, modulePath), bytes, { flag: 'wx' });
Object.assign(index.bundle, { version: 144, minAppVersion: '9.0.91',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${bundlePath}`,
  sha256: hash(fs.readFileSync(path.join(root, bundlePath))), signature: '' });
Object.assign(catalogue, { bundleVersion: 144, bundleFile: bundlePath, minAppVersion: '9.0.91' });
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
console.log('Prepared TEST Bundle 144, all unrelated bundle bytes preserved. Nothing published.');
