#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const owner = 'kas021';
const repository = 'Module-Testing-PL';
const branch = 'main';
const urlPrefix = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/`;
const pathPrefix = `/${owner}/${repository}/${branch}/`;
const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootArg = process.argv.indexOf('--root');
if (rootArg >= 0 && !process.argv[rootArg + 1]) {
  console.error('Usage: node scripts/verify_repository.mjs [--root REPOSITORY_PATH]');
  process.exit(2);
}
const root = fs.realpathSync(rootArg >= 0 ? process.argv[rootArg + 1] : scriptRoot);
const errors = [];
const verified = { modules: 0, artworkModules: 0, jsonHashes: 0 };

function fail(label, message) {
  errors.push(`${label}: ${message}`);
}

function safePath(relative, label) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\')) {
    fail(label, 'invalid repository-relative path');
    return null;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(relative);
  } catch {
    fail(label, 'path has invalid percent encoding');
    return null;
  }
  if (decoded.startsWith('/') || decoded.split('/').some((part) => !part || part === '.' || part === '..')) {
    fail(label, 'path is absolute or contains unsafe segments');
    return null;
  }
  const absolute = path.resolve(root, ...decoded.split('/'));
  const fromRoot = path.relative(root, absolute);
  if (!fromRoot || fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) {
    fail(label, 'path escapes repository root');
    return null;
  }
  if (!fs.existsSync(absolute)) {
    fail(label, `missing file ${decoded}`);
    return null;
  }
  const real = fs.realpathSync(absolute);
  const realRelative = path.relative(root, real);
  if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
    fail(label, 'resolved path escapes repository root');
    return null;
  }
  return { absolute: real, relative: decoded };
}

function readJson(relative) {
  const item = safePath(relative, relative);
  if (!item) return null;
  try {
    return JSON.parse(fs.readFileSync(item.absolute, 'utf8'));
  } catch (error) {
    fail(relative, `invalid JSON (${error.message})`);
    return null;
  }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function packageFile(label, descriptor, { requirePackagePath = false } = {}) {
  if (!descriptor || typeof descriptor !== 'object') {
    fail(label, 'descriptor must be an object');
    return null;
  }
  if (typeof descriptor.packageUrl !== 'string') {
    fail(label, 'packageUrl is missing');
    return null;
  }

  let url;
  try {
    url = new URL(descriptor.packageUrl);
  } catch {
    fail(label, 'packageUrl is invalid');
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'raw.githubusercontent.com' ||
      url.username || url.password || url.port || url.search || url.hash ||
      !url.pathname.startsWith(pathPrefix)) {
    fail(label, `packageUrl must resolve under ${urlPrefix}`);
    return null;
  }
  const relative = url.pathname.slice(pathPrefix.length);
  if (!relative) {
    fail(label, 'packageUrl does not name a file');
    return null;
  }
  if (requirePackagePath && typeof descriptor.packagePath !== 'string') {
    fail(label, 'packagePath is required');
    return null;
  }
  if (descriptor.packagePath != null && descriptor.packagePath !== `${pathPrefix}${relative}`) {
    fail(label, 'packagePath does not match its TEST packageUrl');
    return null;
  }

  const file = safePath(relative, label);
  if (!file) return null;
  if (typeof descriptor.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(descriptor.sha256)) {
    fail(label, 'sha256 must contain 64 hexadecimal characters');
    return null;
  }
  const actual = sha256(file.absolute);
  if (actual.toLowerCase() !== descriptor.sha256.toLowerCase()) {
    fail(label, `SHA-256 mismatch for ${file.relative}: expected ${descriptor.sha256}, got ${actual}`);
    return null;
  }
  return file;
}

function allowedKeys(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(label, 'must be a JSON object');
    return;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(label, `unsupported key ${key}`);
    if (['script', 'scripts', 'runtime', 'js'].includes(key.toLowerCase())) {
      fail(label, `executable key ${key} is forbidden`);
    }
  }
}

function safeArtworkUrl(value, label) {
  if (typeof value !== 'string' || value.length > 2048) {
    fail(label, 'must be an HTTPS URL');
    return;
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(label, 'must be an HTTPS URL');
    return;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || !host || url.username || url.password ||
      (url.port && url.port !== '443') || host === 'localhost' ||
      host.endsWith('.localhost') || host.endsWith('.local') ||
      host.endsWith('.lan') || host.endsWith('.internal')) {
    fail(label, 'must be a public HTTPS URL');
  }
}

function validateArtworkJson(label, document, descriptor) {
  allowedKeys(document, new Set([
    'schemaVersion', 'type', 'id', 'name', 'version', 'description', 'attribution', 'entries',
  ]), label);
  if (!document || document.schemaVersion !== 1 || document.type !== 'artwork') {
    fail(label, 'must use artwork schemaVersion 1 and type "artwork"');
    return;
  }
  for (const key of ['id', 'name', 'version']) {
    if (document[key] !== descriptor[key]) fail(label, `${key} does not match artworkModules descriptor`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(document.id || '')) fail(label, 'id is invalid');
  if (!/^[A-Za-z0-9][A-Za-z0-9.+_-]{0,63}$/.test(document.version || '')) fail(label, 'version is invalid');
  if (typeof document.name !== 'string' || !document.name.trim() || document.name.length > 120) {
    fail(label, 'name is invalid');
  }
  if (Buffer.byteLength(JSON.stringify(document), 'utf8') > 2 * 1024 * 1024) {
    fail(label, 'exceeds the app 2 MiB artwork-package limit');
  }
  if (document.description != null && !isNormalizedPlainText(document.description, 4000)) {
    fail(label, 'description must be plain text with normalized whitespace and no controls');
  }

  const attribution = document.attribution;
  allowedKeys(attribution, new Set(['name', 'url']), `${label}.attribution`);
  if (typeof attribution?.name !== 'string' || !attribution.name.trim() || attribution.name.length > 120) {
    fail(label, 'attribution.name is invalid');
  }
  if (typeof attribution?.url === 'string') safeArtworkUrl(attribution.url, `${label}.attribution.url`);
  else fail(label, 'attribution.url is required');

  if (!Array.isArray(document.entries) || document.entries.length > 1000) {
    fail(label, 'entries must be an array of at most 1000 items');
    return;
  }
  const ids = new Set();
  for (const [index, entry] of document.entries.entries()) {
    const entryLabel = `${label}.entries[${index}]`;
    allowedKeys(entry, new Set([
      'moduleId', 'seriesId', 'posterUrl', 'backdropUrl', 'titleLogoUrl', 'description', 'tags',
    ]), entryLabel);
    if (typeof entry?.moduleId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(entry.moduleId)) {
      fail(entryLabel, 'moduleId is invalid');
    }
    if (typeof entry?.moduleId === 'string' && !moduleIds.has(entry.moduleId)) {
      fail(entryLabel, `moduleId ${entry.moduleId} is not in repository.json`);
    }
    if (typeof entry?.seriesId !== 'string' || !entry.seriesId.trim() ||
        entry.seriesId.length > 2048 || hasControlCharacters(entry.seriesId)) {
      fail(entryLabel, 'seriesId is invalid');
    }
    const key = `${entry?.moduleId}\n${entry?.seriesId}`;
    if (ids.has(key)) fail(entryLabel, 'duplicate moduleId/seriesId');
    ids.add(key);
    for (const keyName of ['posterUrl', 'backdropUrl', 'titleLogoUrl']) {
      if (entry?.[keyName] != null) safeArtworkUrl(entry[keyName], `${entryLabel}.${keyName}`);
    }
    if (entry?.description != null && !isNormalizedPlainText(entry.description, 4000)) {
      fail(entryLabel, 'description must be plain text with normalized whitespace and no controls');
    }
    if (entry?.tags != null && (!Array.isArray(entry.tags) || entry.tags.length > 20 ||
        entry.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 80))) {
      fail(entryLabel, 'tags must contain at most 20 non-empty strings of at most 80 characters');
    }
  }
}

function hasControlCharacters(value) {
  return /[\u0000-\u001f\u007f\u2028\u2029]/u.test(value);
}

function isNormalizedPlainText(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength &&
    !hasControlCharacters(value) && !/<\/?[a-z][^>]*>/iu.test(value) &&
    value === value.replace(/\s+/gu, ' ').trim();
}

function verifyChecksumManifest() {
  const sums = path.join(root, 'SHA256SUMS');
  if (!fs.existsSync(sums)) return;
  const seen = new Set();
  for (const [index, line] of fs.readFileSync(sums, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (!match) {
      fail(`SHA256SUMS:${index + 1}`, 'invalid checksum line');
      continue;
    }
    const [, expected, relative] = match;
    if (seen.has(relative)) fail(`SHA256SUMS:${index + 1}`, `duplicate path ${relative}`);
    seen.add(relative);
    const file = safePath(relative, `SHA256SUMS:${index + 1}`);
    if (!file) continue;
    const actual = sha256(file.absolute);
    if (actual.toLowerCase() !== expected.toLowerCase()) {
      fail(`SHA256SUMS:${index + 1}`, `SHA-256 mismatch for ${relative}`);
    } else if (relative.endsWith('.json')) {
      verified.jsonHashes += 1;
    }
  }
}

const index = readJson('repository.json');
const catalogue = readJson('catalogue.json');
if (!index || !catalogue) {
  console.error(errors.join('\n'));
  process.exit(1);
}

if (index.repositoryId !== 'module-testing-pl' || catalogue.repositoryId !== index.repositoryId) {
  fail('repository identity', 'repository.json and catalogue.json must identify module-testing-pl');
}
if (!Array.isArray(index.modules) || !Array.isArray(catalogue.modules)) {
  fail('catalogue', 'repository.json and catalogue.json must contain module arrays');
  console.error(errors.join('\n'));
  process.exit(1);
}

const modulePaths = new Map();
const moduleIds = new Set();
for (const module of index.modules) {
  const label = `module ${module?.moduleId || '(missing id)'}`;
  if (!module?.moduleId || moduleIds.has(module.moduleId)) fail(label, 'moduleId is missing or duplicated');
  moduleIds.add(module?.moduleId);
  const file = packageFile(label, module, { requirePackagePath: true });
  if (file) {
    if (!file.relative.startsWith('modules/')) fail(label, 'module packageUrl must point into modules/');
    modulePaths.set(file.relative, module);
    verified.modules += 1;
  }
}

const cataloguePaths = new Set();
for (const [position, entry] of catalogue.modules.entries()) {
  const label = `catalogue.modules[${position}]`;
  const file = safePath(entry?.file, label);
  if (!file) continue;
  if (!file.relative.startsWith('modules/')) fail(label, 'file must point into modules/');
  if (cataloguePaths.has(file.relative)) fail(label, `duplicate package ${file.relative}`);
  cataloguePaths.add(file.relative);
  if (entry.sha256 != null) {
    const indexed = modulePaths.get(file.relative);
    if (!indexed || indexed.sha256 !== entry.sha256) fail(label, 'sha256 disagrees with repository.json');
  }
  if (entry.packageUrl != null && entry.packageUrl !== `${urlPrefix}${file.relative}`) {
    fail(label, 'packageUrl does not point to this TEST package');
  }
}
if (cataloguePaths.size !== modulePaths.size ||
    [...modulePaths.keys()].some((file) => !cataloguePaths.has(file))) {
  fail('catalogue modules', 'catalogue.json package files do not match repository.json modules');
}

const bundle = packageFile('bundle', index.bundle, { requirePackagePath: true });
if (!bundle) {
  // packageFile already records the actionable error.
} else {
  if (!bundle.relative.startsWith('bundles/')) fail('bundle', 'packageUrl must point into bundles/');
  if (catalogue.bundleFile !== bundle.relative || catalogue.bundleVersion !== index.bundle.version) {
    fail('bundle', 'bundle file/version disagrees with catalogue.json');
  }
  try {
    const members = execFileSync('unzip', ['-Z1', bundle.absolute], { encoding: 'utf8' })
      .split(/\r?\n/).filter(Boolean);
    const names = new Set(members);
    for (const file of cataloguePaths) {
      const expectedName = path.posix.basename(file);
      if (!names.has(expectedName)) fail('bundle', `missing catalogue package ${expectedName}`);
    }
  } catch (error) {
    fail('bundle', `could not inspect ZIP contents; unzip is required (${error.message})`);
  }
}

if (index.artworkModules != null) {
  if (!Array.isArray(index.artworkModules)) {
    fail('artworkModules', 'must be an array when present');
  } else {
    const artworkIds = new Set();
    for (const [position, descriptor] of index.artworkModules.entries()) {
      const label = `artworkModules[${position}]`;
      if (!descriptor || typeof descriptor !== 'object') {
        fail(label, 'descriptor must be an object');
        continue;
      }
      for (const field of ['id', 'name', 'version']) {
        if (typeof descriptor[field] !== 'string' || !descriptor[field].trim()) fail(label, `${field} is required`);
      }
      if (artworkIds.has(descriptor.id)) fail(label, `duplicate id ${descriptor.id}`);
      artworkIds.add(descriptor.id);
      const file = packageFile(label, descriptor);
      if (!file) continue;
      verified.artworkModules += 1;
      if (file.relative.endsWith('.json')) {
        let document;
        try {
          const source = fs.readFileSync(file.absolute, 'utf8');
          document = JSON.parse(source);
          if (Buffer.byteLength(source, 'utf8') > 2 * 1024 * 1024) fail(label, 'exceeds the app 2 MiB artwork-package limit');
        } catch (error) {
          fail(label, `invalid artwork JSON (${error.message})`);
        }
        if (document) validateArtworkJson(label, document, descriptor, moduleIds);
      }
    }
  }
}

if (index.catalogueSha256 != null) {
  if (!/^[a-f0-9]{64}$/i.test(index.catalogueSha256) || sha256(path.join(root, 'catalogue.json')) !== index.catalogueSha256.toLowerCase()) {
    fail('catalogueSha256', 'does not match catalogue.json');
  } else {
    verified.jsonHashes += 1;
  }
}
if (index.catalogue && typeof index.catalogue === 'object' && index.catalogue.sha256 != null) {
  if (index.catalogue.sha256 !== sha256(path.join(root, 'catalogue.json'))) {
    fail('catalogue.sha256', 'does not match catalogue.json');
  } else {
    verified.jsonHashes += 1;
  }
}

verifyChecksumManifest();

if (errors.length) {
  console.error(`Repository verification failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Repository verification passed: ${verified.modules} modules, Bundle ${index.bundle.version}, ${verified.artworkModules} artwork packages, ${verified.jsonHashes} checksummed JSON files.`);
