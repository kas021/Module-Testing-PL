import test from 'node:test';
import assert from 'node:assert/strict';
import { supersedesCandidate } from './release-policy.mjs';
test('stable release retires corresponding and older betas', () => {
  assert.equal(supersedesCandidate('1.1.1', '1.1.0-beta.2'), true);
  assert.equal(supersedesCandidate('1.2.4', '1.2.4-beta.4'), true);
  assert.equal(supersedesCandidate('1.10.0', '1.9.9-beta.1'), true);
});
test('older releases do not retire new work', () => {
  assert.equal(supersedesCandidate('1.0.4', '1.1.0-beta.2'), false);
  assert.equal(supersedesCandidate('1.2.3', '1.2.4-beta.4'), false);
  assert.equal(supersedesCandidate('1.2.4-beta.5', '1.2.4-beta.4'), false);
  assert.equal(supersedesCandidate('unknown', '1.2.4-beta.4'), false);
});
