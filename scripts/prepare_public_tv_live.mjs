// Owner-approved TEST-only preparation. This script never publishes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { testingKey, providerMessage, defaultsMessage, signatureErrors } from './repository_signatures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [sourceArg, certificationArg] = process.argv.slice(2);
if (!sourceArg || !certificationArg) {
  throw new Error('Pass the verified Public-TV-Live ZIP and its final S2 certification JSON');
}
const source = path.resolve(sourceArg);
const certificationFile = path.resolve(certificationArg);
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const encode = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) :
  value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
const sameJson = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const index = read('repository.json');
const catalogue = read('catalogue.json');
if (index.repositoryId !== 'module-testing-pl' || index.bundle.version !== 147 ||
    catalogue.bundleVersion !== 147 || catalogue.bundleFile !== 'bundles/Synthetiq-Module-Bundle-147.zip' ||
    index.signature !== '' || index.modules.length !== 44 || catalogue.modules.length !== 44) {
  throw new Error('Unexpected TEST baseline; expected repo147 with 44 modules');
}
if (index.modules.some((module, i) => !catalogue.modules[i]?.file ||
    !module.packagePath?.endsWith(`/${catalogue.modules[i].file}`))) {
  throw new Error('Repository and catalogue module counts/order differ');
}
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });

const bytes = fs.readFileSync(source);
const digest = hash(bytes);
const manifest = JSON.parse(execFileSync('unzip', ['-p', source, 'module.json'], { encoding: 'utf8' }));
if (manifest.id !== 'public-tv-live-v1' || manifest.moduleVersion !== '0.1.0-beta.2' ||
    manifest.moduleIdentityNumber !== 113 || manifest.moduleIdentity !== 'SP-VID-113-PUBLIC-TV-LIVE' ||
    manifest.moduleFamilyId !== 'public_tv_live_v1' ||
    index.modules.some(m => m.moduleId === manifest.id || m.moduleIdentityNumber === 113)) {
  throw new Error('Unexpected or duplicate Public TV Live identity');
}

const certification = JSON.parse(fs.readFileSync(certificationFile, 'utf8'));
const sim = certification.simulator;
const reportedZip = typeof certification.sourceZip === 'string'
  ? path.resolve(process.cwd(), certification.sourceZip)
  : '';
if (certification.grade !== 'PASS' || certification.profile !== 'standard' ||
    certification.runtime?.ok !== true || sim?.ok !== true ||
    sim.fixture !== 'shared-playback-host-live' ||
    sim.summary?.fixture !== 'shared-playback-host-live' ||
    sim.summary?.moduleId !== manifest.id || sim.summary?.sha256 !== digest ||
    typeof certification.sourceZip !== 'string' ||
    !fs.existsSync(reportedZip) || hash(fs.readFileSync(reportedZip)) !== digest) {
  throw new Error('Candidate requires exact S2 PASS standard/runtime/simulator/live-fixture/hash evidence');
}

const file = 'Public-TV-Live-0.1.0-beta.2.zip';
const modulePath = `modules/${file}`;
const bundlePath = 'bundles/Synthetiq-Module-Bundle-148.zip';
for (const name of [modulePath, bundlePath]) {
  if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing overwrite: ${name}`);
}

const keyPath = path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Unsafe key permissions');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const pub = createPublicKey(key).export({ format: 'jwk' });
if (pub.x !== testingKey.x || pub.y !== testingKey.y) throw new Error('Unexpected signing key');
const signature = message => sign('sha256', Buffer.from(message), {
  key, dsaEncoding: 'ieee-p1363',
}).toString('base64');

const originalModules = encode(index.modules);
const originalCatalogueModules = encode(catalogue.modules);
const originalDefaults = index.defaultModules === undefined ? undefined : encode(index.defaultModules);
const providerName = 'synthetiq-subtitles.provider.json';
const baselineProvider = {
  schemaVersion: index.schemaVersion,
  repositoryId: index.repositoryId,
  publishedAtMs: index.publishedAtMs,
  provider: JSON.parse(JSON.stringify(index.subtitleProviders[0])),
};
const publishedAtMs = Date.now();
const presentation = {
  category: 'Live TV',
  purpose: 'General',
  recommended: false,
  language: 'Multiple languages',
};
const changelog = [
  'Optional TEST-only active selection: ACI Sport TV, France 24 English, and France 24 Arabic. Al Arabiya is excluded because its stream was confirmed as ended DVR (EXT-X-ENDLIST). Channel audio languages have not been independently verified.',
  'Included only after S2 PASS standard-profile runtime and native simulator live-fixture acceptance for this exact candidate ZIP.',
  'This repository preparation is not a public release or a guarantee of future channel availability.',
];
index.publishedAtMs = publishedAtMs;
index.modules.push({
  moduleId: manifest.id,
  moduleFamilyId: manifest.moduleFamilyId,
  moduleIdentity: manifest.moduleIdentity,
  moduleIdentityNumber: manifest.moduleIdentityNumber,
  contentType: 'video',
  version: manifest.moduleVersion,
  minAppVersion: '9.0.92',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${modulePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${modulePath}`,
  sha256: digest,
  signature: '',
  publishedAtMs,
  presentation,
  changelog,
});
catalogue.modules.push({ file: modulePath, presentation, changelog });
if (encode(index.modules.slice(0, 44)) !== originalModules ||
    encode(catalogue.modules.slice(0, 44)) !== originalCatalogueModules ||
    (originalDefaults !== undefined && encode(index.defaultModules) !== originalDefaults)) {
  throw new Error('Existing module entries, signatures, catalogue entries, or defaults changed');
}

if (index.subtitleProviders?.length !== 1) throw new Error('Unexpected subtitle provider list');
for (const provider of index.subtitleProviders) {
  provider.signature = signature(providerMessage(index, provider));
}
if (index.defaultModules && Object.keys(index.defaultModules).length) {
  index.defaultModulesSignature = signature(defaultsMessage(index));
}
const provider = {
  schemaVersion: index.schemaVersion,
  repositoryId: index.repositoryId,
  publishedAtMs,
  provider: index.subtitleProviders[0],
};

let restoredMissingProvider = false;
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'public-tv-live-bundle-'));
try {
  execFileSync('unzip', ['-q', path.join(root, catalogue.bundleFile), '-d', stage]);
  const existingNames = fs.readdirSync(stage).sort();
  const expectedModuleNames = JSON.parse(originalCatalogueModules).map(entry => path.basename(entry.file)).sort();
  const actualModuleNames = existingNames.filter(name => name !== providerName);
  const hasProvider = existingNames.includes(providerName);
  if ((existingNames.length !== 44 && existingNames.length !== 45) ||
      JSON.stringify(actualModuleNames) !== JSON.stringify(expectedModuleNames)) {
    throw new Error('Bundle 147 must contain exactly the 44 catalogued module ZIPs, with an optional subtitle provider');
  }
  restoredMissingProvider = !hasProvider;
  if (hasProvider && !sameJson(
    JSON.parse(fs.readFileSync(path.join(stage, providerName), 'utf8')),
    baselineProvider,
  )) throw new Error('Bundle 147 subtitle-provider payload does not match the signed repository index');
  const preserved = new Map(existingNames
    .filter(name => name !== providerName)
    .map(name => [name, hash(fs.readFileSync(path.join(stage, name)))]));
  fs.writeFileSync(path.join(stage, file), bytes, { flag: 'wx' });
  fs.writeFileSync(path.join(stage, providerName), encode(provider));
  execFileSync('zip', ['-q', path.join(root, bundlePath), ...fs.readdirSync(stage).sort()], { cwd: stage });
  for (const [name, oldDigest] of preserved) {
    if (hash(execFileSync('unzip', ['-p', path.join(root, bundlePath), name], {
      maxBuffer: 64 * 1024 * 1024,
    })) !== oldDigest) {
      throw new Error(`Unrelated bundle entry changed: ${name}`);
    }
  }
  const bundledProvider = JSON.parse(execFileSync('unzip', ['-p', path.join(root, bundlePath), providerName], {
    encoding: 'utf8',
  }));
  if (!sameJson(bundledProvider, provider)) {
    throw new Error('Bundle 148 subtitle-provider payload does not match the signed repository index');
  }
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}

fs.writeFileSync(path.join(root, modulePath), bytes, { flag: 'wx' });
Object.assign(index.bundle, {
  version: 148,
  minAppVersion: '9.0.92',
  packageUrl: `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${bundlePath}`,
  packagePath: `/kas021/Module-Testing-PL/main/${bundlePath}`,
  sha256: hash(fs.readFileSync(path.join(root, bundlePath))),
  signature: '',
});
Object.assign(catalogue, { bundleVersion: 148, bundleFile: bundlePath, minAppVersion: '9.0.92' });
index.testingIdentity = index.modules.map(m => `${m.moduleId}:${m.version}:${m.sha256}`).join('|');
const catalogueBytes = encode(catalogue);
if (index.catalogueSha256) index.catalogueSha256 = hash(catalogueBytes);
if (index.catalogue?.sha256) index.catalogue.sha256 = hash(catalogueBytes);
const errors = signatureErrors(index, { allowCommunityIndex: true });
if (errors.length) throw new Error(errors.join('\n'));

for (const [name, data] of [
  ['catalogue.json', catalogueBytes],
  ['repository.json', encode(index)],
  ['subtitle-provider.json', encode(provider)],
]) {
  fs.writeFileSync(path.join(root, name), data);
}
const sums = new Map(fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n').map(line => {
  const match = /^([a-f0-9]{64})\s+(.+)$/.exec(line);
  if (!match) throw new Error('Invalid checksums');
  return [match[2], match[1]];
}));
for (const name of [modulePath, bundlePath, 'catalogue.json', 'repository.json', 'subtitle-provider.json']) {
  sums.set(name, hash(fs.readFileSync(path.join(root, name))));
}
fs.writeFileSync(path.join(root, 'SHA256SUMS'), [...sums]
  .map(([name, value]) => `${value}  ${name}`).join('\n') + '\n');
execFileSync(process.execPath, [path.join(root, 'scripts/verify_repository.mjs')], { stdio: 'inherit' });
const providerAction = restoredMissingProvider
  ? 'Restored the missing subtitle-provider payload in Bundle 148 from the signed repository index.'
  : 'Rebound the subtitle-provider payload in Bundle 148 to the signed repository index.';
console.log(`Prepared TEST Bundle 148; preserved 44 prior modules. ${providerAction} Candidate SHA-256: ${digest}. Nothing published.`);
