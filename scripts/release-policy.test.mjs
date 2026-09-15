import test from 'node:test';
import assert from 'node:assert/strict';
import { supersedesCandidate, assertTestingCapacity } from './release-policy.mjs';
test('three candidates and one explicit failure fixture, not unlimited modules', () => {
  const candidates = [{id:'a'}, {id:'b'}, {id:'c'}];
  const fixture = {id:'testing-123-v1', moduleIdentityNumber:998, qaFixture:'intentional-playback-failure'};
  assert.doesNotThrow(() => assertTestingCapacity([...candidates, fixture]));
  assert.throws(() => assertTestingCapacity([...candidates, {id:'d'}]));
  assert.throws(() => assertTestingCapacity([...candidates, fixture, fixture]));
});
test('stable release retires corresponding and older betas', () => {
  assert.equal(supersedesCandidate('1.1.1', '1.1.0-beta.2'), true);
  assert.equal(supersedesCandidate('1.2.4', '1.2.4-beta.4'), true);
  assert.equal(supersedesCandidate('1.10.0', '1.9.9-beta.1'), true);
});
test('one explicitly identified V9 live candidate can coexist with existing tests', () => {
  const candidates = [{id:'a'}, {id:'b'}, {id:'c'}];
  const live = {id:'dw-live-v1', moduleIdentityNumber:77, config:{capabilities:{live_discovery_v1:true}}};
  assert.doesNotThrow(() => assertTestingCapacity([...candidates, live]));
  assert.throws(() => assertTestingCapacity([...candidates, live, live]));
  assert.throws(() => assertTestingCapacity([...candidates, {...live, id:'other'}]));
});
test('older releases do not retire new work', () => {
  assert.equal(supersedesCandidate('1.0.4', '1.1.0-beta.2'), false);
  assert.equal(supersedesCandidate('1.2.3', '1.2.4-beta.4'), false);
  assert.equal(supersedesCandidate('1.2.4-beta.5', '1.2.4-beta.4'), false);
  assert.equal(supersedesCandidate('unknown', '1.2.4-beta.4'), false);
});
