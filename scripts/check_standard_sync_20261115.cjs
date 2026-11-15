'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const qa = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const app = '/Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114';
const candidates = JSON.parse(fs.readFileSync(path.join(qa, 'candidates.json')));
const attempt = process.argv[2] || 'first';
if (!/^[a-z0-9-]+$/.test(attempt)) throw new Error('Invalid attempt label');
const suffix = attempt === 'first' ? '' : '-' + attempt;
const results = [];
const ids = ['animeheaven-v2-1', 'xstream-v1', 'streamingunity-v1', 'movy-v1'];
const selected = process.argv[3];
if (selected && !ids.includes(selected)) throw new Error('Unknown candidate');
for (const id of ids.filter(id => !selected || id === selected)) {
  const candidate = candidates.find(c => c.id === id);
  const args = attempt.startsWith('build-budget')
    ? [path.join(__dirname, 'certify_build_budget_20261115.cjs'), candidate.runtimeZip, candidate.query]
    : ['MODULE_TESTER/s2_cli.js', candidate.runtimeZip,
    '--profile', 'standard', '--query', candidate.query, '--lang', 'sub',
    '--device', '5CEE559D-CBDD-4D73-B771-4D284B341011'];
  const run = cp.spawnSync(process.execPath, args, {
    cwd: app, env: { ...process.env,
      NODE_PATH: '/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules' },
    timeout: attempt.startsWith('build-budget') ? 1500000 : 660000,
    encoding: 'utf8', maxBuffer: 1048576,
  });
  fs.writeFileSync(path.join(qa, 'checks', id + '-standard' + suffix + '.log'), run.stdout + '\n' + run.stderr);
  let summary;
  try { summary = JSON.parse(run.stdout); } catch { summary = {}; }
  const result = { id, sha256: candidate.sha256, query: candidate.query,
    exitCode: run.status, grade: summary.grade || 'BLOCKED', runId: summary.runId || null,
    runtimeOk: summary.runtimeOk ?? null, media: summary.media || [],
    failureCodes: summary.failureCodes || [run.error?.code || 'MISSING_SUMMARY'],
    simulatorOk: summary.simulatorOk ?? null, labExecution: summary.labExecution || null,
    physicalAcceptance: false };
  results.push(result);
  fs.writeFileSync(path.join(qa, 'standard-checks' + suffix + '.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
