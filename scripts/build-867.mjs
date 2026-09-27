import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const REPOSITORY_ID = 'module-testing-pl-867';
const MIN_APP_VERSION = '8.6.0';
const SIDE_CAR_PATH = 'testing/8.6.7';
const BASE_URL = `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/${SIDE_CAR_PATH}/`;
const SPECS = [
  ['flux', 'synthetiq-anime-direct', '1.0.3-beta.6'],
  ['anime', 'synthetiq-anime-v1', '1.0.5-beta.3'],
  ['anikoto', 'anikoto-v4', '5.0.5-beta.3'],
];
const CAPS_FIELDS = ['homeMaxResults', 'maxResponseBytes', 'timeoutMs', 'maxConcurrentRequests'];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readPackage(label, expectedId, expectedVersion, inputPath) {
  const file = path.resolve(inputPath);
  if (!fs.statSync(file).isFile()) throw new Error(`${label} input is not a file`);
  const filename = path.basename(file);
  if (!/^[A-Za-z0-9._-]+\.zip$/.test(filename)) throw new Error(`${label} ZIP filename is not URL-safe`);

  execFileSync('unzip', ['-tqq', file], {stdio: 'pipe'});
  const entries = execFileSync('unzip', ['-Z1', file], {encoding: 'utf8'}).trim().split('\n');
  if (!entries.includes('module.json') || !entries.includes('index.js')) {
    throw new Error(`${label} ZIP must contain root module.json and index.js`);
  }
  const manifest = JSON.parse(execFileSync('unzip', ['-p', file, 'module.json'], {encoding: 'utf8'}));
  if (manifest.id !== expectedId) throw new Error(`${label} package must have module id ${expectedId}`);
  if (manifest.moduleVersion !== expectedVersion) throw new Error(`${label} package must have version ${expectedVersion}`);
  if (manifest.contentType !== 'video' || typeof manifest.moduleVersion !== 'string' ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.moduleVersion)) {
    throw new Error(`${label} package has invalid video module metadata`);
  }
  if (!manifest.moduleFamilyId || !manifest.moduleIdentity || !Number.isInteger(manifest.moduleIdentityNumber)) {
    throw new Error(`${label} package is missing module identity fields`);
  }
  if (manifest.config?.capabilities?.live_discovery_v1 === true) {
    throw new Error(`${label} package requires the Player 9.0 live-discovery capability`);
  }
  const caps = manifest.config?.caps;
  if (!caps || CAPS_FIELDS.some(key => !Number.isSafeInteger(caps[key]) || caps[key] < 1)) {
    throw new Error(`${label} package must declare positive integer config.caps: ${CAPS_FIELDS.join(', ')}`);
  }
  return {file, filename, manifest, sha256: sha256(file)};
}

function writeJson(file, value) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function build867({repoRoot, inputs, bundleVersion = 1, publishedAtMs = Date.now()}) {
  if (!Number.isSafeInteger(bundleVersion) || bundleVersion < 1) throw new Error('bundleVersion must be a positive integer');
  if (!Number.isSafeInteger(publishedAtMs) || publishedAtMs < 0) throw new Error('publishedAtMs must be a non-negative integer');
  if (!inputs || Object.keys(inputs).sort().join(',') !== SPECS.map(([key]) => key).sort().join(',')) {
    throw new Error('Provide exactly --flux, --anime, and --anikoto ZIP inputs');
  }

  const packages = SPECS.map(([label, id, version]) => readPackage(label, id, version, inputs[label]));
  if (new Set(packages.map(item => item.filename)).size !== packages.length ||
      new Set(packages.map(item => item.manifest.moduleIdentity)).size !== packages.length ||
      new Set(packages.map(item => item.manifest.moduleIdentityNumber)).size !== packages.length) {
    throw new Error('Sidecar package filenames and module identities must be unique');
  }

  const root = path.resolve(repoRoot);
  const sidecar = path.join(root, SIDE_CAR_PATH);
  const packageDir = path.join(sidecar, 'modules');
  const bundleDir = path.join(sidecar, 'bundles');
  const bundleName = `Testing-${bundleVersion}.zip`;
  const bundlePath = path.join(bundleDir, bundleName);
  const packagePaths = packages.map(item => path.join(packageDir, item.filename));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'module-testing-pl-867-'));
  const tempBundle = path.join(tempDir, bundleName);

  try {
    execFileSync('zip', ['-j', '-X', tempBundle, ...packages.map(item => item.file)], {stdio: 'pipe'});
    const bundleHash = sha256(tempBundle);
    for (let i = 0; i < packages.length; i++) {
      if (fs.existsSync(packagePaths[i]) && sha256(packagePaths[i]) !== packages[i].sha256) {
        throw new Error(`Refusing to replace immutable sidecar package ${packages[i].filename}`);
      }
    }
    if (fs.existsSync(bundlePath) && sha256(bundlePath) !== bundleHash) {
      throw new Error(`Refusing to replace immutable sidecar bundle ${bundleName}; increment bundleVersion`);
    }

    fs.mkdirSync(packageDir, {recursive: true});
    fs.mkdirSync(bundleDir, {recursive: true});
    for (let i = 0; i < packages.length; i++) {
      if (!fs.existsSync(packagePaths[i])) fs.copyFileSync(packages[i].file, packagePaths[i], fs.constants.COPYFILE_EXCL);
    }
    if (!fs.existsSync(bundlePath)) fs.copyFileSync(tempBundle, bundlePath, fs.constants.COPYFILE_EXCL);

    const packageInfo = (item) => {
      const relative = `modules/${item.filename}`;
      const packageUrl = BASE_URL + relative;
      return {
        packageUrl,
        packagePath: new URL(packageUrl).pathname,
        sha256: item.sha256,
        signature: '',
      };
    };
    const modules = packages.map(item => {
      const m = item.manifest;
      return {
        moduleId: m.id,
        moduleFamilyId: m.moduleFamilyId,
        moduleIdentity: m.moduleIdentity,
        moduleIdentityNumber: m.moduleIdentityNumber,
        contentType: m.contentType,
        version: m.moduleVersion,
        ...packageInfo(item),
        minAppVersion: MIN_APP_VERSION,
        publishedAtMs,
        presentation: {...m.presentation, recommended: false, purpose: 'Testing only'},
        changelog: ['Player 8.6.7 comparison candidate; see the 8.6.7 PL testing notes.'],
      };
    });
    const bundleUrl = BASE_URL + `bundles/${bundleName}`;
    const repository = {
      schemaVersion: 1,
      repositoryId: REPOSITORY_ID,
      name: 'Module Testing PL 8.6.7',
      enabled: true,
      publishedAtMs,
      signature: '',
      testingIdentity: packages.map(item => `${item.manifest.id}:${item.manifest.moduleVersion}:${item.sha256}`).join('|'),
      bundle: {
        version: bundleVersion,
        packageUrl: bundleUrl,
        packagePath: new URL(bundleUrl).pathname,
        sha256: bundleHash,
        signature: '',
        minAppVersion: MIN_APP_VERSION,
      },
      modules,
    };
    const capsAudit = {
      schemaVersion: 1,
      repositoryId: REPOSITORY_ID,
      minAppVersion: MIN_APP_VERSION,
      modules: packages.map(item => ({
        moduleId: item.manifest.id,
        version: item.manifest.moduleVersion,
        configCaps: Object.fromEntries(CAPS_FIELDS.map(key => [key, item.manifest.config.caps[key]])),
      })),
    };
    writeJson(path.join(sidecar, 'module-caps.json'), capsAudit);
    writeJson(path.join(sidecar, 'repository.json'), repository);
    return {sidecar, repositoryPath: path.join(sidecar, 'repository.json'), bundlePath, moduleCount: modules.length};
  } finally {
    fs.rmSync(tempDir, {recursive: true, force: true});
  }
}

function parseArgs(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!value || !['--flux', '--anime', '--anikoto', '--bundle-version'].includes(key)) {
      throw new Error('Usage: node scripts/build-867.mjs --flux ZIP --anime ZIP --anikoto ZIP [--bundle-version N]');
    }
    if (values[key]) throw new Error(`Duplicate argument ${key}`);
    values[key] = value;
  }
  if (['--flux', '--anime', '--anikoto'].some(key => !values[key])) {
    throw new Error('Usage: node scripts/build-867.mjs --flux ZIP --anime ZIP --anikoto ZIP [--bundle-version N]');
  }
  return {
    inputs: {flux: values['--flux'], anime: values['--anime'], anikoto: values['--anikoto']},
    bundleVersion: values['--bundle-version'] === undefined ? 1 : Number(values['--bundle-version']),
  };
}

const invokedPath = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  try {
    const result = build867({repoRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), ...parseArgs(process.argv.slice(2))});
    console.log(`Prepared ${result.moduleCount}-module PL sidecar at ${path.relative(process.cwd(), result.repositoryPath)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
