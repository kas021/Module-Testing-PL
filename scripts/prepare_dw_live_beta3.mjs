// Prepare only the owner-approved TEST release; never pushes or publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { testingKey, providerMessage, defaultsMessage, signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Pass the verified DW Live beta.3 ZIP path');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 141 ||
    catalogue.bundleVersion !== 141 || index.signature !== '') throw new Error('Unexpected TEST baseline');
if (index.subtitleProviders?.length !== 1 || index.subtitleProviders[0].providerID !== 'synthetiq-subtitles') {
  throw new Error('Expected exactly the existing native subtitle provider');
}
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
const moduleBytes = fs.readFileSync(source);
if (createHash('sha256').update(moduleBytes).digest('hex') !==
    '6068c5f67e3fc64303cd6e39f49141fd153f13f38c32e13fb0b2a0c7d5697cbb') {
  throw new Error('Not the reviewed beta.3 artifact');
}
const manifest = JSON.parse(execFileSync('unzip', ['-p', source, 'module.json'], { encoding: 'utf8' }));
if (manifest.id !== 'dw-live-v1' || manifest.moduleVersion !== '0.1.0-beta.3' ||
    manifest.moduleIdentityNumber !== 110 || manifest.moduleIdentity !== 'SP-VID-110-DW-LIVE') {
  throw new Error('Unexpected module identity');
}
if (index.modules.some((m) => m.moduleId === manifest.id || m.moduleIdentityNumber === 110)) {
  throw new Error('Duplicate module identity');
}
const filename = 'DW-Live-0.1.0-beta.3.zip';
const modulePath = `modules/${filename}`;
const bundlePath = 'bundles/Synthetiq-Module-Bundle-142.zip';
for (const name of [modulePath, bundlePath]) {
  if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing overwrite: ${name}`);
}
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
const keyPath = process.env.SYNTHETIQ_TEST_SIGNING_JWK || path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Unsafe key permissions');
const key = createPrivateKey({ key: readKey(), format: 'jwk' });
function readKey() { return JSON.parse(fs.readFileSync(keyPath, 'utf8')); }
const publicKey = createPublicKey(key).export({ format: 'jwk' });
if (publicKey.x !== testingKey.x || publicKey.y !== testingKey.y) throw new Error('Unexpected signing key');
const signature = (message) => sign('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }).toString('base64');
index.publishedAtMs = Date.now();
const changelog = [
  'TEST-only official DW English, Spanish and Arabic live news channels. Requires Player 9.0.90 for the Live clock/resume fixes.',
  'beta.3 corrects the private candidate identity collision with Flux; playback JavaScript is byte-identical to beta.2. Physical-device acceptance remains pending.',
];
index.modules.push({
  moduleId: manifest.id, moduleFamilyId: manifest.moduleFamilyId,
  moduleIdentity: manifest.moduleIdentity, moduleIdentityNumber: 110,
  contentType: 'video', version: manifest.moduleVersion, minAppVersion: '9.0.90',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${modulePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${modulePath}`,
  sha256: hash(moduleBytes), signature: '', publishedAtMs: index.publishedAtMs,
  changelog, presentation: manifest.presentation,
});
catalogue.modules.push({ file: modulePath, presentation: manifest.presentation, changelog });
for (const provider of index.subtitleProviders || []) provider.signature = signature(providerMessage(index, provider));
if (index.defaultModules) index.defaultModulesSignature = signature(defaultsMessage(index));
const providerDescriptor = { schemaVersion: index.schemaVersion, repositoryId: index.repositoryId,
  publishedAtMs: index.publishedAtMs, provider: index.subtitleProviders[0] };
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-live-test-bundle-'));
try {
  execFileSync('unzip', ['-q', path.join(root, catalogue.bundleFile), '-d', stage]);
  fs.writeFileSync(path.join(stage, filename), moduleBytes, { flag: 'wx' });
  fs.writeFileSync(path.join(stage, 'synthetiq-subtitles.provider.json'), encode(providerDescriptor));
  execFileSync('zip', ['-q', path.join(root, bundlePath), ...fs.readdirSync(stage).sort()], { cwd: stage });
} finally { fs.rmSync(stage, { recursive: true, force: true }); }
fs.writeFileSync(path.join(root, modulePath), moduleBytes, { flag: 'wx' });
index.bundle = { ...index.bundle, version: 142, minAppVersion: '9.0.90',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${bundlePath}`,
  sha256: hash(fs.readFileSync(path.join(root, bundlePath))), signature: '' };
catalogue.bundleVersion = 142;
catalogue.bundleFile = bundlePath;
catalogue.minAppVersion = '9.0.90';
index.testingIdentity = index.modules.map((m) => `${m.moduleId}:${m.version}:${m.sha256}`).join('|');
const catalogueBytes = encode(catalogue);
if (index.catalogueSha256) index.catalogueSha256 = hash(catalogueBytes);
if (index.catalogue?.sha256) index.catalogue.sha256 = hash(catalogueBytes);
const errors = signatureErrors(index, { allowCommunityIndex: true });
if (errors.length) throw new Error(errors.join('\n'));
for (const [name, bytes] of [['catalogue.json', catalogueBytes], ['repository.json', encode(index)],
    ['subtitle-provider.json', encode(providerDescriptor)]]) fs.writeFileSync(path.join(root, name), bytes);
const sums = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map((line) => {
  const m = /^([a-f0-9]{64})\s+(.+)$/.exec(line);
  if (!m) throw new Error('Invalid checksum manifest');
  return [m[2], m[1]];
}));
for (const name of [modulePath, bundlePath, 'catalogue.json', 'repository.json', 'subtitle-provider.json']) {
  sums.set(name, hash(fs.readFileSync(path.join(root, name))));
}
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums].map(([name, digest]) => `${digest}  ${name}`).join('\n') + '\n');
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
console.log('Prepared TEST Bundle 142 with DW Live beta.3. Nothing published.');
