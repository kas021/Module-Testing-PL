'use strict';
// Existing evidence plus a network-free pure-parser fixture; no app execution.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const Zip = require('/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules/adm-zip');
const root = path.resolve(__dirname, '..');
const app = '/Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114';
const qa = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => JSON.parse(fs.readFileSync(f));
const candidates = read(path.join(qa, 'candidates.json'));
const runs = [
  ['yflix-v1', '2026-11-15T13-59-02-956Z_s2_yflix-v1_1baddba8'],
  ['megakino-v1', '2026-11-15T14-03-38-028Z_s2_megakino-v1_d1c308e5'],
  ['megakino-v1', '2026-11-15T14-09-24-190Z_s2_megakino-v1_882a43d2'],
  ['moviedb-wiki-v1', '2026-11-15T14-05-10-321Z_s2_moviedb-wiki-v1_ce156a01'],
  ['movy-v1', '2026-11-15T14-06-01-017Z_s2_movy-v1_caeaec4e'],
  ['movy-v1', '2026-11-15T15-17-48-717Z_s2_movy-v1_7d4debe5'],
];
const evidence = runs.map(([id, runId]) => {
  const file = path.join(app, 'MODULE_TESTER/reports/runs', runId, 'certification.json');
  const b = fs.readFileSync(file), report = JSON.parse(b);
  const candidate = candidates.find(c => c.id === id);
  assert.equal(report.inspection.sha256, candidate.sha256);
  assert.equal(hash(fs.readFileSync(path.join(qa, 'candidates', candidate.file))), candidate.sha256);
  return { id, runId, reportPath: file, reportSha256: hash(b), candidateSha256: candidate.sha256,
    profile: report.profile, grade: report.grade, failureCodes: report.failureCodes,
    runtimeOk: report.runtime?.ok, simulatorOk: report.simulator?.ok ?? null,
    media: report.media.map(m => ({ label: m.label, ok: m.analysis?.ok })),
    language: { total: report.language.length,
      contradictions: report.language.filter(l => l.contradiction).length,
      skippedContradictions: report.language.filter(l => l.contradiction && l.skipped).length,
      nonSkippedContradictions: report.language.filter(l => l.contradiction && !l.skipped).length,
      audio: report.language.filter(l => l.kind === 'audio').map(l => ({
        declared: l.declaredLanguage, detected: l.detectedLanguage, confidence: l.confidence,
        skipped: l.skipped, contradiction: l.contradiction })) } };
});
const movie = candidates.find(c => c.id === 'moviedb-wiki-v1');
const source = new Zip(path.join(qa, 'candidates', movie.file)).getEntry('index.js').getData().toString();
const start = source.indexOf('  function parseRef(ref) {');
const end = source.indexOf('\n  function cardHref(', start);
assert(start >= 0 && end > start);
const parserSource = source.slice(start, end);
const ctx = vm.createContext({});
new vm.Script(`${parserSource}\nthis.results = [parseRef('https://www.movy.sx/movie/27205'), parseRef('mdb:movie:27205')];`).runInContext(ctx, { timeout: 1000 });
assert.equal(ctx.results[0], null);
assert.equal(ctx.results[1].id, '27205');
const appFiles = [
  'lib/services/module_update_state.dart', 'lib/services/module_repository_client.dart',
  'lib/services/module_update_preferences.dart', 'lib/services/module_source_presentation.dart',
  'lib/models/module_repository.dart', 'lib/config/module_update_config.dart',
  'lib/widgets/module_manager_list.dart', 'lib/screens/settings/settings_media_screen.dart',
];
const sourceFiles = appFiles.map(file => ({ file: path.join(app, file), sha256: hash(fs.readFileSync(path.join(app, file))) }));
const receipt = { reviewedAt: new Date().toISOString(),
  decision: 'NO_HELD_PACKAGE_CLEARED_FOR_SYNC', newRuntimeRuns: 0, newNetworkMediaProbes: 0,
  evidence, movieDbParserFixture: { candidateSha256: movie.sha256,
    isolatedFunctionSha256: hash(parserSource), networkRequests: 0, moduleHandlersExecuted: 0,
    emittedReference: 'https://www.movy.sx/movie/27205', accepted: false,
    controlReference: 'mdb:movie:27205', controlAccepted: true },
  sameVersionLogoRefresh: { appRoot: app,
    appHead: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim(),
    sourceFiles, method: 'checkInstalledModulesManually',
    behavior: 'Fresh index -> apply presentation before version comparison -> remember catalogue -> save bindings -> notify listeners. No package/version/publication revision comparison gates presentation.',
    needsPackageVersionBump: false, needsBundleVersionBump: false, needsPublicationTimestampBump: false,
    manualFreshFetch: true, automaticIntervalHours: 24,
    limitations: ['Source inspection only; native acceptance remains queued.',
      'Existing linked modules required; unlinked same-version modules are not automatically adopted.',
      'refreshCatalogues alone saves catalogue entries, not installed presentation bindings.',
      'Busy playback/cache/import operations block manual maintenance; refresh requires a successful index fetch.',
      'Current inspected working files include concurrent parent changes; source hashes identify the exact read-only snapshot.'] },
  historicalMovyPass: { runId: '2026-11-11T23-01-25-952Z_s2_movy-v1_cbbf8862',
    source: 'Official commit-pinned docs/Movy-0.1.0-beta.4-QA.md',
    treatment: 'Acknowledged exact-package standard PASS on Alone, but later Fight Club native failure and 18/25 broad A/V samples prevent a new safe-sync clearance.' },
  safeNow: ['Movy repository/catalogue iconUrl metadata only; Drama Direct already declares its valid logo.'],
  notRun: ['Flutter', 'S2', 'Simulator', 'Native tests', 'Media decoding', 'Publication'] };
fs.writeFileSync(path.join(root, 'docs/V9_HELD_REVIEW_20261115.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ decision: receipt.decision, reviewedExactHashReports: evidence.length,
  movieDbParserFixture: receipt.movieDbParserFixture, sameVersionRefresh: 'NO_VERSION_OR_REVISION_BUMP_REQUIRED_FOR_LINKED_MANUAL_CHECK' }, null, 2));
