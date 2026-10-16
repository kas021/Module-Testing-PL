import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { providerMessage, signatureErrors, testingKey } from './repository_signatures.mjs';

if (process.argv.slice(2).join(' ') !== '--community --write') {
  throw new Error('Usage: node scripts/sign_repository.mjs --community --write (local TEST metadata only)');
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'repository.json');
const original = fs.readFileSync(file, 'utf8');
const index = JSON.parse(original);
if (index.repositoryId !== 'module-testing-pl' || index.schemaVersion !== 1) {
  throw new Error('Refusing a non-TEST repository');
}
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
for (const descriptor of [index.bundle, ...index.modules]) {
  const url = new URL(descriptor.packageUrl);
  const prefix = '/kas021/Module-Testing-PL/main/';
  if (url.origin !== 'https://raw.githubusercontent.com' || url.pathname !== descriptor.packagePath ||
      !url.pathname.startsWith(prefix) || url.search || url.hash || url.username || url.password) {
    throw new Error('Package is not an exact TEST repository path');
  }
  const relative = decodeURIComponent(url.pathname.slice(prefix.length));
  const absolute = fs.realpathSync(path.join(root, relative));
  const inside = path.relative(root, absolute);
  if (inside.startsWith('..') || path.isAbsolute(inside) ||
      digest(fs.readFileSync(absolute)) !== descriptor.sha256.toLowerCase()) {
    throw new Error('Package path or checksum mismatch');
  }
}
const keyPath = process.env.SYNTHETIQ_TEST_SIGNING_JWK ||
  path.join(os.homedir(), '.config/synthetiq/module-testing-signing.jwk');
if ((fs.statSync(keyPath).mode & 0o077) !== 0) throw new Error('Signing key permissions are too broad');
const key = createPrivateKey({ key: JSON.parse(fs.readFileSync(keyPath, 'utf8')), format: 'jwk' });
const publicKey = createPublicKey(key).export({ format: 'jwk' });
if (publicKey.x !== testingKey.x || publicKey.y !== testingKey.y) throw new Error('Unexpected TEST key');
const signature = (message) => sign('sha256', Buffer.from(message),
  { key, dsaEncoding: 'ieee-p1363' }).toString('base64');
for (const p of index.subtitleProviders || []) p.signature = signature(providerMessage(index, p));
// Keep source provenance manual: shipped fallback manifests already use that
// identity. Native providers remain separately bound to the trusted TEST key.
index.signature = '';
index.bundle.signature = '';
const errors = signatureErrors(index, { allowCommunityIndex: true });
if (errors.length) throw new Error(errors.join('\n'));
// Serialize all outputs before replacing any local publication metadata.
const outputs = new Map([['repository.json', `${JSON.stringify(index, null, 2)}\n`]]);
if (index.subtitleProviders?.length === 1) {
  outputs.set('subtitle-provider.json', `${JSON.stringify({
    schemaVersion: index.schemaVersion, repositoryId: index.repositoryId,
    publishedAtMs: index.publishedAtMs, provider: index.subtitleProviders[0],
  }, null, 2)}\n`);
}
const sumsPath = path.join(root, 'SHA256SUMS');
const sums = fs.readFileSync(sumsPath, 'utf8').trim().split('\n').map((line) => {
  const match = /^([a-f0-9]{64})\s+(.+)$/.exec(line);
  if (!match) throw new Error('Malformed checksum manifest');
  return [match[2], match[1]];
});
const hashes = new Map(sums);
for (const [name, bytes] of outputs) hashes.set(name, digest(bytes));
outputs.set('SHA256SUMS', [...hashes].map(([name, hash]) => `${hash}  ${name}`).join('\n') + '\n');
if (fs.readFileSync(file, 'utf8') !== original) throw new Error('Index changed while signing');
for (const [name, bytes] of outputs) {
  const temporary = path.join(root, `${name}.signing-${process.pid}`);
  fs.writeFileSync(temporary, bytes, { flag: 'wx' });
  fs.renameSync(temporary, path.join(root, name));
}
console.log(`Signed native declarations for community TEST Bundle ${index.bundle.version}; ${index.modules.length} module archives unchanged. Nothing published.`);
