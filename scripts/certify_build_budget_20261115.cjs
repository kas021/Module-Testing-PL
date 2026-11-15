'use strict';
// Local lab adapter: allow compile/setup time without shortening playback checks.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const cp = require('node:child_process');
const app = '/Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114';
const qa = '/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115';
const [zip, query] = process.argv.slice(2);
if (!zip || !query) throw new Error('ZIP and query required');
const frozenCommit = '797804dda4884c0333aeaf8e9595405a4b240034';
function assertFrozenSource() {
  const git = args => cp.execFileSync('git', ['-C', app, ...args], { encoding: 'utf8' }).trim();
  if (git(['rev-parse', 'HEAD']) !== frozenCommit ||
      git(['status', '--porcelain', '--untracked-files=no'])) {
    throw new Error('Frozen app source changed; stop acceptance');
  }
}
assertFrozenSource();
const runner = require(path.join(app, 'MODULE_TESTER/lib/s2/process.js'));
const original = runner.runProcess;
let adapted = false;
runner.runProcess = (command, args, options = {}) => {
  if (command === 'flutter' && args[0] === 'test' &&
      args.includes('integration_test/s2_video_playback_test.dart')) {
    if (options.timeoutMs !== 300000 ||
        !args.includes('--dart-define=S2_OBSERVE_SECONDS=120')) {
      throw new Error('Unexpected standard lab contract; do not alter it silently');
    }
    adapted = true;
    return original(command, args, { ...options, timeoutMs: 900000 });
  }
  return original(command, args, options);
};
const certifier = require(path.join(app, 'MODULE_TESTER/lib/s2/certifier.js'));
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const test = path.join(app, 'integration_test/s2_video_playback_test.dart');
const testHash = digest(test);
certifier.certifyVideoModule(zip, { profile: 'standard', query, lang: 'sub',
  deviceUdid: '5CEE559D-CBDD-4D73-B771-4D284B341011' }).then(result => {
  assertFrozenSource();
  if (digest(test) !== testHash) throw new Error('Playback assertions changed during run');
  const execution = { runId: result.runId, zipSha256: digest(zip),
    playbackFixtureSha256: testHash, sourceCommit: frozenCommit, sourceUnmodified: true,
    standardObservationSeconds: 120, originalProcessBudgetMs: 300000,
    labProcessBudgetMs: adapted ? 900000 : null,
    reason: 'Stock deadline counted compile/setup and terminated observation at 79 seconds',
    grade: result.grade, functionalAssertionsChanged: false };
  fs.writeFileSync(path.join(qa, 'checks', result.runId + '-execution.json'),
    JSON.stringify(execution, null, 2) + '\n');
  console.log(JSON.stringify({ ...result, labExecution: execution }));
  process.exitCode = ['PASS', 'PARTIAL'].includes(result.grade) ? 0 : 1;
}).catch(error => { console.error(error.stack); process.exitCode = 1; });
