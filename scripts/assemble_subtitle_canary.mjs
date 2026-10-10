import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createPrivateKey, createPublicKey, sign, verify, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`);
const hash = (name) => createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 136) {
  throw new Error('Unexpected base; never overwrite a published bundle');
}
const keyPath = process.env.SYNTHETIQ_TEST_SIGNING_JWK || path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const publicKey = createPublicKey(key);
const publicJwk = publicKey.export({ format: 'jwk' });
if (publicJwk.x !== '2VzSrHdi6iUPAiXKHef5_oetwLVJcg1Zf_GPgP2SzgQ' || publicJwk.y !== 'jTmpxbakMpLQ3aF97g3CgUxX91e-pv-2mJbkZw4oxHM') throw new Error('Unexpected TEST key');
const signature = (fields) => {
  const data = Buffer.from(fields.join('\n'));
  const signed = sign('sha256', data, { key, dsaEncoding: 'ieee-p1363' });
  if (!verify('sha256', data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signed)) throw new Error('Signature failed');
  return signed.toString('base64');
};
index.publishedAtMs = Date.now();
const provider = {
  providerID: 'synthetiq-subtitles', version: 1, type: 'native',
  endpoint: 'https://one.synthetiq.uk/player/subtitles/v1',
  config: { minAppVersion: '9.0.74' },
};
provider.signature = signature([1, index.repositoryId, index.publishedAtMs,
  provider.providerID, provider.version, provider.type, provider.endpoint, JSON.stringify(provider.config)]);
index.subtitleProviders = [provider];
const descriptor = { schemaVersion: 1, repositoryId: index.repositoryId, publishedAtMs: index.publishedAtMs, provider };
const bundlePath = 'bundles/Synthetiq-Module-Bundle-137.zip';
if (fs.existsSync(path.join(root, bundlePath))) throw new Error('Bundle already exists');
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'subtitle-canary-'));
try {
  const members = index.modules.map((module) => {
    const relative = module.packagePath.split('/main/')[1];
    if (!relative?.startsWith('modules/') || relative.includes('..') || hash(relative) !== module.sha256) throw new Error('Module checksum mismatch');
    const name = path.basename(relative);
    fs.copyFileSync(path.join(root, relative), path.join(staging, name));
    return name;
  });
  fs.writeFileSync(path.join(staging, 'synthetiq-subtitles.provider.json'), `${JSON.stringify(descriptor, null, 2)}\n`);
  execFileSync('zip', ['-q', path.join(root, bundlePath), ...members, 'synthetiq-subtitles.provider.json'], { cwd: staging });
} finally { fs.rmSync(staging, { recursive: true, force: true }); }
write('subtitle-provider.json', descriptor);
index.bundle.version = 137;
index.bundle.packagePath = `/kas021/Module-Testing-PL/main/${bundlePath}`;
index.bundle.packageUrl = `https://raw.githubusercontent.com${index.bundle.packagePath}`;
index.bundle.sha256 = hash(bundlePath);
index.bundle.signature = signature(['bundle', 137, index.bundle.minAppVersion, index.publishedAtMs, index.bundle.packagePath, index.bundle.sha256]);
for (const m of index.modules) {
  m.signature = signature([m.moduleId, m.version, m.moduleFamilyId || '', m.moduleIdentity || '',
    m.moduleIdentityNumber ?? '', m.contentType, m.minAppVersion, m.publishedAtMs, m.packagePath, m.sha256]);
}
if (index.defaultModules) index.defaultModulesSignature = signature([index.repositoryId, index.publishedAtMs,
  index.defaultModules.video || '', index.defaultModules.image || '', index.defaultModules.music || '']);
index.signature = signature([1, index.repositoryId, index.name, String(index.enabled), index.publishedAtMs,
  index.bundle.signature, ...index.modules.map((m) => m.signature)]);
catalogue.bundleVersion = 137;
catalogue.bundleFile = bundlePath;
write('catalogue.json', catalogue);
if (index.catalogueSha256) index.catalogueSha256 = hash('catalogue.json');
if (index.catalogue?.sha256) index.catalogue.sha256 = hash('catalogue.json');
write('repository.json', index);
const sums = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map((line) => {
  const match = /^([a-f0-9]{64})\s+(.+)$/.exec(line);
  if (!match) throw new Error('Invalid checksum manifest');
  return [match[2], match[1]];
}));
for (const name of [bundlePath, 'repository.json', 'catalogue.json', 'subtitle-provider.json']) sums.set(name, hash(name));
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums].map(([name, digest]) => `${digest}  ${name}`).join('\n') + '\n');
console.log('Prepared TEST Bundle 137; video packages unchanged; not published.');
