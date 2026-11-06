const assert = require('node:assert/strict');
const { calculate } = require('../static/level-calculator.js');

const rules = { apRecoveryMinutes: 6, expTable: { 1: 100, 2: 120, 3: 150, 4: 200 } };
const base = { currentLevel: 1, currentExp: 0, targetLevel: 3, currentAp: 100, apCap: 120, expPerAp: 1 };

let result = calculate(base, rules);
assert.equal(result.requiredExp, 220);
assert.equal(result.requiredAp, 220);
assert.equal(result.canPayNow, false);
assert.equal(result.waitAp, 120);
assert.equal(result.waitMs, 120 * 6 * 60 * 1000);
assert.equal(result.needsMultipleRuns, true);
assert.equal(result.remainingCurrentLevel, 100);

assert.equal(calculate({ ...base, currentExp: 40, expPerAp: 2 }, rules).requiredExp, 180);
assert.equal(calculate({ ...base, currentExp: 40, expPerAp: 2 }, rules).requiredAp, 90);
assert.equal(calculate({ ...base, currentExp: 40, expPerAp: 3 }, rules).requiredAp, 60);
assert.equal(calculate({ ...base, currentLevel: 3, currentExp: 40, targetLevel: 3 }, rules).reached, true);
assert.equal(calculate({ ...base, currentLevel: 4, targetLevel: 3 }, rules).error, '目标等级不能低于当前等级。');
assert.equal(calculate({ ...base, currentExp: 100 }, rules).error, '当前经验已达到或超过升级所需经验，请先修正经验值。');
assert.match(calculate({ ...base, targetLevel: 6 }, rules).error, /暂不支持/);
assert.match(calculate({ ...base, currentLevel: 2 }, { ...rules, expTable: { 1: 100, 3: 150 } }).error, /缺少/);
assert.match(calculate({ ...base, currentExp: '' }, rules).error, /完整/);
assert.match(calculate({ ...base, currentLevel: -1 }, rules).error, /正整数/);
assert.match(calculate({ ...base, currentAp: 121 }, rules).error, /超过/);
assert.match(calculate({ ...base, expPerAp: 0 }, rules).error, /大于 0/);
console.log('level calculator tests passed');
