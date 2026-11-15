'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const QA = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const APP = '/Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114';
const rows = JSON.parse(fs.readFileSync(path.join(QA, 'candidates.json')));
const results = [];
fs.mkdirSync(path.join(QA, 'checks'), { recursive: true });
for (const c of rows) {
  const run = cp.spawnSync(process.execPath, ['MODULE_TESTER/s2_cli.js', c.runtimeZip,
    '--profile', 'quick', '--query', c.query, '--lang', 'sub'], {
    cwd: APP, env: { ...process.env,
      NODE_PATH: '/Volumes/ZX20/.codex-worktrees/player-v9/MODULE_TESTER/node_modules' },
    timeout: 240000, encoding: 'utf8', maxBuffer: 1048576,
  });
  fs.writeFileSync(path.join(QA, 'checks', c.id + '.log'), run.stdout + '\n' + run.stderr);
  let summary;
  try { summary = JSON.parse(run.stdout); } catch { summary = {}; }
  const result = { id: c.id, sha256: c.sha256, query: c.query, exitCode: run.status,
    grade: summary.grade || 'BLOCKED', runId: summary.runId || null,
    runtimeOk: summary.runtimeOk ?? null, media: summary.media || [],
    failureCodes: summary.failureCodes || [run.error?.code || 'MISSING_SUMMARY'],
    simulatorRun: false, physicalAcceptance: false };
  results.push(result);
  fs.writeFileSync(path.join(QA, 'checks.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
