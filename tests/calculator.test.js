const assert = require('node:assert/strict');
const { calculate } = require('../static/calculator.js');

const minute = 60 * 1000;
const recordedAt = Date.UTC(2026, 0, 1, 0, 0, 0);

assert.deepEqual(calculate({ recordedPoints: 10, cap: 100, apPerHour: 10, recordedAt, now: recordedAt + 12 * minute }), {
  valid: true, recordedPoints: 10, recordedAt, cap: 100, recovered: 2, currentPoints: 12,
  apPerHour: 10, isOperating: true, recoveryIntervalMs: 6 * minute, atCap: false, paused: false, elapsedMs: 12 * minute, nextRecoveryAt: recordedAt + 18 * minute,
  remainingMs: 6 * minute, progress: 0.12,
});
assert.equal(calculate({ recordedPoints: 10, cap: 100, recordedAt, now: recordedAt + 5 * minute }).recovered, 0);
assert.equal(calculate({ recordedPoints: 10, cap: 12, recordedAt, now: recordedAt + 60 * minute }).currentPoints, 12);
assert.equal(calculate({ recordedPoints: 10, cap: 100, apPerHour: 20, recordedAt, now: recordedAt + 3 * minute }).recovered, 1);
assert.equal(calculate({ recordedPoints: 12, cap: 12, recordedAt, now: recordedAt + 60 * minute }).atCap, true);
assert.deepEqual(calculate({ recordedPoints: 889, cap: 204, recordedAt, now: recordedAt + 60 * minute }), {
  valid: true, recordedPoints: 889, recordedAt, cap: 204, recovered: 0, currentPoints: 889,
  apPerHour: 10, isOperating: true, recoveryIntervalMs: 6 * minute,
  atCap: true, paused: false, elapsedMs: 60 * minute, nextRecoveryAt: null, remainingMs: 0, progress: 1,
});
assert.equal(calculate({ recordedPoints: 10, cap: 100, recordedAt, isOperating: false, now: recordedAt + 60 * minute }).recovered, 0);
assert.equal(calculate({ recordedPoints: 10, cap: 100, recordedAt, isOperating: false, now: recordedAt + 60 * minute }).paused, true);
assert.equal(calculate({ recordedPoints: 10, cap: 100, recordedAt, now: recordedAt - minute }).remainingMs, 6 * minute);
assert.equal(calculate({ recordedPoints: -1, cap: 100, recordedAt, now: recordedAt }).valid, false);
assert.equal(calculate({ recordedPoints: -1, cap: 100, recordedAt, now: recordedAt }).valid, false);
assert.equal(calculate({ recordedPoints: 1.5, cap: 100, recordedAt, now: recordedAt }).valid, false);
assert.equal(calculate({ recordedPoints: 1, cap: 'bad', recordedAt, now: recordedAt }).valid, false);
console.log('calculator tests passed');
