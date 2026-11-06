const assert = require('node:assert/strict');
const { calculate } = require('../static/calculator.js');

const minute = 60 * 1000;
const recordedAt = Date.UTC(2026, 0, 1, 0, 0, 0);

assert.deepEqual(calculate({ recordedPoints: 10, cap: 100, recordedAt, now: recordedAt + 12 * minute }), {
  valid: true, recordedPoints: 10, recordedAt, cap: 100, recovered: 2, currentPoints: 12,
  atCap: false, elapsedMs: 12 * minute, nextRecoveryAt: recordedAt + 18 * minute,
  remainingMs: 6 * minute, progress: 0.12,
});
assert.equal(calculate({ recordedPoints: 10, cap: 100, recordedAt, now: recordedAt + 5 * minute }).recovered, 0);
assert.equal(calculate({ recordedPoints: 10, cap: 12, recordedAt, now: recordedAt + 60 * minute }).currentPoints, 12);
assert.equal(calculate({ recordedPoints: 12, cap: 12, recordedAt, now: recordedAt + 60 * minute }).atCap, true);
assert.equal(calculate({ recordedPoints: 10, cap: 100, recordedAt, now: recordedAt - minute }).remainingMs, 6 * minute);
assert.equal(calculate({ recordedPoints: -1, cap: 100, recordedAt, now: recordedAt }).valid, false);
assert.equal(calculate({ recordedPoints: 101, cap: 100, recordedAt, now: recordedAt }).valid, false);
assert.equal(calculate({ recordedPoints: 1.5, cap: 100, recordedAt, now: recordedAt }).valid, false);
assert.equal(calculate({ recordedPoints: 1, cap: 'bad', recordedAt, now: recordedAt }).valid, false);
console.log('calculator tests passed');
