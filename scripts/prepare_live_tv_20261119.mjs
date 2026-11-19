// Owner-approved TEST update (2026-11-19): DW Live beta.4, Public TV Live beta.5,
// TVApp Live beta.11. Preparation never publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { testingKey, providerMessage, metadataProviderMessage, defaultsMessage, signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = process.argv[2];
if (!srcDir) throw new Error('Pass the folder holding the verified ZIPs');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const encode = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 160 ||
    catalogue.bundleVersion !== 160 || index.signature !== '') throw new Error('Unexpected TEST baseline');
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });

const UPDATES = [
  { id: 'dw-live-v1', from: 'DW-Live-0.1.0-beta.3.zip', to: 'DW-Live-0.1.0-beta.4.zip', version: '0.1.0-beta.4',
    sha: '20a1bcee77a5e1f909547431f95912eb23f2d48cb3853d567d77acd547dd6405',
    changelog: ['0.1.0-beta.4: dw.com intermittently refuses page requests (403). The module now retries, keeps the last source found and falls back to each channel\'s official DW master playlist, still checked as an active live playlist. 3/3 channels played in the V9 runtime (was 0/3).'] },
  { id: 'public-tv-live-v1', from: 'Public-TV-Live-0.1.0-beta.4.zip', to: 'Public-TV-Live-0.1.0-beta.5.zip', version: '0.1.0-beta.5',
    sha: '34fc7e1a54aec2686935e681d2e1637ff51fe2ac4690d739510662ee9ac0898c',
    changelog: ['0.1.0-beta.5: France 24 English returns. The public list switched it to an unofficial relay; the approved official France 24 route is kept while the channel is listed and is re-validated as live media on every play. 4/4 channels played (was 3/4).'] },
  { id: 'tvapp-live-v1', from: 'TVApp-Live-0.1.0-beta.10.zip', to: 'TVApp-Live-0.1.0-beta.11.zip', version: '0.1.0-beta.11',
    sha: '9881b840268a79e6a10070db758132dff76f3cf760b84933b217b9317b962c13',
    changelog: ['0.1.0-beta.11: Adult content filter on both third-party feeds (title, category and tags). When a channel\'s main feed is off air, its listed alternate feeds are tried (HD first).',
      '0.1.0-beta.11: V9 runtime: NFL Network, CNN, 24/7 The Simpsons, Tennis Channel, Fox Footy and NHL Network played; Willow and Sky Sports Racing were off air at the provider (every feed 404).'] },
];

const keyPath = path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Unsafe key permissions');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const pub = createPublicKey(key).export({ format: 'jwk' });
if (pub.x !== testingKey.x || pub.y !== testingKey.y) throw new Error('Unexpected signing key');
const signature = message => sign('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }).toString('base64');

const bundlePath = 'bundles/Synthetiq-Module-Bundle-161.zip';
if (fs.existsSync(path.join(root, bundlePath))) throw new Error('Refusing overwrite: ' + bundlePath);
index.publishedAtMs = Date.now();
const staged = [];
for (const u of UPDATES) {
  const bytes = fs.readFileSync(path.join(srcDir, u.to));
  if (hash(bytes) !== u.sha) throw new Error('Unreviewed candidate ' + u.to);
  const manifest = JSON.parse(execFileSync('unzip', ['-p', path.join(srcDir, u.to), 'module.json'], { encoding: 'utf8' }));
  const entry = index.modules.find(m => m.moduleId === u.id);
  const catEntry = catalogue.modules.find(m => m.file === `modules/${u.from}`);
  if (!entry || !catEntry || manifest.id !== u.id || manifest.moduleVersion !== u.version) throw new Error('Identity mismatch ' + u.id);
  const modulePath = `modules/${u.to}`;
  if (fs.existsSync(path.join(root, modulePath))) throw new Error('Refusing overwrite: ' + modulePath);
  const changelog = u.changelog.concat(entry.changelog || []).slice(0, 6);
  Object.assign(entry, { version: u.version,
    packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${modulePath}`,
    packagePath: `/kas021/Module-Testing-PL/main/${modulePath}`, sha256: hash(bytes),
    signature: '', publishedAtMs: index.publishedAtMs, changelog });
  Object.assign(catEntry, { file: modulePath, changelog });
  staged.push({ u, bytes, modulePath });
}
for (const provider of index.subtitleProviders || []) provider.signature = signature(providerMessage(index, provider));
for (const meta of index.metadataProviders || []) if (meta.scoreEndpoint == null) meta.signature = signature(metadataProviderMessage(index, meta));
if (index.defaultModules) index.defaultModulesSignature = signature(defaultsMessage(index));
if (index.subtitleProviders?.length !== 1) throw new Error('Unexpected provider list');
const provider = { schemaVersion: index.schemaVersion, repositoryId: index.repositoryId,
  publishedAtMs: index.publishedAtMs, provider: index.subtitleProviders[0] };
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'live-tv-bundle-'));
try {
  execFileSync('unzip', ['-q', path.join(root, catalogue.bundleFile), '-d', stage]);
  const replaced = staged.map(s => s.u.from);
  const preserved = new Map(fs.readdirSync(stage).filter(n => !replaced.includes(n) && n !== 'synthetiq-subtitles.provider.json')
    .map(n => [n, hash(fs.readFileSync(path.join(stage, n)))]));
  for (const s of staged) {
    if (!fs.existsSync(path.join(stage, s.u.from))) throw new Error('Bundle missing ' + s.u.from);
    fs.unlinkSync(path.join(stage, s.u.from));
    fs.writeFileSync(path.join(stage, s.u.to), s.bytes, { flag: 'wx' });
  }
  fs.writeFileSync(path.join(stage, 'synthetiq-subtitles.provider.json'), encode(provider));
  execFileSync('zip', ['-q', path.join(root, bundlePath), ...fs.readdirSync(stage).sort()], { cwd: stage });
  for (const [name, digest] of preserved) {
    if (hash(execFileSync('unzip', ['-p', path.join(root, bundlePath), name], { maxBuffer: 64 * 1024 * 1024 })) !== digest) {
      throw new Error(`Unrelated bundle entry changed: ${name}`);
    }
  }
} finally { fs.rmSync(stage, { recursive: true, force: true }); }
for (const s of staged) fs.writeFileSync(path.join(root, s.modulePath), s.bytes, { flag: 'wx' });
Object.assign(index.bundle, { version: 161,
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${bundlePath}`,
  sha256: hash(fs.readFileSync(path.join(root, bundlePath))), signature: '' });
Object.assign(catalogue, { bundleVersion: 161, bundleFile: bundlePath });
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
for (const name of [...staged.map(s => s.modulePath), bundlePath, 'catalogue.json', 'repository.json', 'subtitle-provider.json']) sums.set(name, hash(fs.readFileSync(path.join(root, name))));
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums].map(([name, digest]) => `${digest}  ${name}`).join('\n') + '\n');
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
console.log('Prepared TEST Bundle 161 (3 live modules), all unrelated bundle bytes preserved. Nothing published.');
