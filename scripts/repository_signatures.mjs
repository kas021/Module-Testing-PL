import { createPublicKey, verify } from 'node:crypto';

export const testingKey = {
  kty: 'EC', crv: 'P-256',
  x: '2VzSrHdi6iUPAiXKHef5_oetwLVJcg1Zf_GPgP2SzgQ',
  y: 'jTmpxbakMpLQ3aF97g3CgUxX91e-pv-2mJbkZw4oxHM',
};
const keys = [testingKey, {
  kty: 'EC', crv: 'P-256',
  x: '2PfoNJ1JBBN_SiysTf8t3w2tcJy3WXqkrpAuN8HVucA',
  y: '-AI5LjTt8RR7WVzmB5Stg_usa_DAefxeZaxNN51jit0',
}].map((key) => createPublicKey({ key, format: 'jwk' }));

export const providerMessage = (index, p) => [
  index.schemaVersion, index.repositoryId, index.publishedAtMs,
  p.providerID, p.version, p.type, p.endpoint,
  JSON.stringify(Object.fromEntries(Object.keys(p.config || {}).sort().map((k) => [k, p.config[k]]))),
].join('\n');
export const bundleMessage = (index) => [
  'bundle', index.bundle.version, index.bundle.minAppVersion,
  index.publishedAtMs, index.bundle.packagePath, index.bundle.sha256,
].join('\n');
export const moduleMessage = (m) => [
  m.moduleId, m.version, m.moduleFamilyId || '', m.moduleIdentity || '',
  m.moduleIdentityNumber ?? '', m.contentType, m.minAppVersion,
  m.publishedAtMs, m.packagePath, m.sha256,
].join('\n');
export const defaultsMessage = (index) => [
  index.repositoryId, index.publishedAtMs,
  index.defaultModules.video || '', index.defaultModules.image || '',
  index.defaultModules.music || '',
].join('\n');
export const indexMessage = (index) => [
  index.schemaVersion, index.repositoryId, index.name, String(index.enabled),
  index.publishedAtMs, index.bundle.signature, ...index.modules.map((m) => m.signature),
].join('\n');

export function signatureErrors(index, { allowCommunityIndex = false } = {}) {
  const errors = [];
  function check(label, message, encoded) {
    let valid = false;
    try {
      if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(encoded)) {
        throw new Error('Malformed Base64 signature');
      }
      const signature = Buffer.from(encoded, 'base64');
      valid = signature.length === 64 && keys.some((key) => verify(
        'sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }, signature,
      ));
    } catch { /* Malformed signatures are rejected, not treated as unsigned. */ }
    if (!valid) errors.push(`${label}: signature verification failed`);
  }
  if (index.schemaVersion !== 1 || index.repositoryId !== 'module-testing-pl' ||
      !Number.isSafeInteger(index.publishedAtMs) || index.publishedAtMs <= 0) {
    errors.push('Unsupported TEST repository identity or publication revision');
  }
  const ids = new Set();
  for (const p of index.subtitleProviders || []) {
    if (p.providerID !== 'synthetiq-subtitles' || p.version !== 1 || p.type !== 'native' ||
        p.endpoint !== 'https://one.synthetiq.uk/player/subtitles/v1' || ids.has(p.providerID)) {
      errors.push('Unsupported or duplicate native subtitle provider');
    }
    ids.add(p.providerID);
    check('subtitle provider', providerMessage(index, p), p.signature);
  }
  if (allowCommunityIndex && index.signature === '') {
    // Existing TEST archives declare manual fallback publishers. Signing the
    // source index would change ownership and invalidate those declarations.
    if (index.bundle.signature !== '') errors.push('Community bundle must be explicitly unsigned');
    return errors;
  }
  check('bundle', bundleMessage(index), index.bundle.signature);
  for (const m of index.modules) check(`module ${m.moduleId}`, moduleMessage(m), m.signature);
  if (index.defaultModules && Object.keys(index.defaultModules).length) {
    check('defaults', defaultsMessage(index), index.defaultModulesSignature);
  }
  check('repository index', indexMessage(index), index.signature);
  return errors;
}
