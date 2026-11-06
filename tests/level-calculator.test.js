const assert = require('node:assert/strict');
const { calculate } = require('../static/level-calculator.js');
const { cloneRules } = require('../static/game-rules.js');

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
assert.match(calculate({ ...base, expPerAp: 0 }, rules).error, /大于 0/);

const overCapResult = calculate({ ...base, currentAp: 889, apCap: 204 }, rules);
assert.equal(overCapResult.valid, true);
assert.equal(overCapResult.currentAp, 889);
assert.equal(overCapResult.apCap, 204);
assert.equal(overCapResult.canPayNow, true);
assert.equal(overCapResult.waitAp, 0);
assert.equal(overCapResult.waitMs, 0);
assert.equal(overCapResult.needsMultipleRuns, false);
const pausedResult = calculate({ ...base, currentAp: 10 }, { ...rules, isOperating: false });
assert.equal(pausedResult.paused, true);
assert.equal(pausedResult.waitAp, 210);
assert.equal(pausedResult.waitMs, null);
assert.equal(calculate({ ...base, currentAp: 220 }, { ...rules, isOperating: false }).canPayNow, true);

const builtInRules = cloneRules();
assert.equal(Object.keys(builtInRules.expTable).length, 89);
assert.equal(builtInRules.expTable[89], 26770);
assert.equal(calculate({ ...base, currentLevel: 1, currentExp: 0, targetLevel: 3, expPerAp: 1 }, builtInRules).requiredExp, 18);
const { cafeProduction } = require('../static/game-rules.js');
const halfComfortProduction = cafeProduction(6, 1750);
assert.equal(halfComfortProduction.apPerHour, 9.745);
assert.equal(halfComfortProduction.apCap, 460);
assert.equal(cafeProduction(6, 4000).apPerHour, 19.49);
assert.deepEqual(Object.values(builtInRules.cafeRanks).map(({ maxComfort, maxApPerHour, apCap }) => [maxComfort, maxApPerHour, apCap]), [
	[1000, 3.83, 90], [1500, 6.36, 150], [2000, 9.29, 220], [2500, 12.62, 300], [3000, 16.36, 390],
	[3500, 19.49, 460], [4000, 22.32, 530], [4500, 25.15, 600], [5000, 27.97, 670], [5500, 30.8, 740],
]);
console.log('level calculator tests passed');
