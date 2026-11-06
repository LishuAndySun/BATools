/* Pure level target calculations. The table values mean current level -> next level XP. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LevelCalculator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function number(value) {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function integer(value) {
    const parsed = number(value);
    return parsed !== null && Number.isInteger(parsed) ? parsed : null;
  }

  function validateInput({ currentLevel, currentExp, targetLevel, currentAp, apCap, expPerAp }) {
    const current = integer(currentLevel);
    const experience = integer(currentExp);
    const target = integer(targetLevel);
    const ap = integer(currentAp);
    const cap = integer(apCap);
    const perAp = number(expPerAp);
    if ([current, experience, target, ap, cap, perAp].some((value) => value === null)) return "请输入完整的数字，等级、经验和行动点必须是整数。";
    if (current < 1 || target < 1) return "等级必须是正整数。";
    if (experience < 0 || ap < 0 || cap < 0) return "经验值和行动点不能为负数。";
    if (current > target) return "目标等级不能低于当前等级。";
    if (experience < 0) return "当前经验不能为负数。";
    if (perAp <= 0) return "每 AP 获得经验必须大于 0。";
    return null;
  }

  function tableValue(table, level) {
    const value = table && table[String(level)];
    return number(value) !== null && number(value) > 0 ? number(value) : null;
  }

  function calculate(input, rules) {
    const error = validateInput(input);
    if (error) return { valid: false, error };
    const currentLevel = integer(input.currentLevel);
    const currentExp = integer(input.currentExp);
    const targetLevel = integer(input.targetLevel);
    const currentAp = integer(input.currentAp);
    const apCap = integer(input.apCap);
    const expPerAp = number(input.expPerAp);
    const table = rules && rules.expTable;
    const currentLevelXp = tableValue(table, currentLevel);
    if (currentLevelXp === null) return { valid: false, error: `经验表缺少 Lv. ${currentLevel} 到下一级的数据。` };
    if (currentExp >= currentLevelXp) return { valid: false, error: "当前经验已达到或超过升级所需经验，请先修正经验值。" };
    const remainingCurrentLevel = currentLevelXp - currentExp;
    if (currentLevel === targetLevel) {
      return {
        valid: true, reached: true, currentLevel, targetLevel, currentExp, currentLevelXp,
        remainingCurrentLevel, requiredExp: 0, requiredAp: 0, currentAp, apCap, expPerAp,
        waitAp: 0, waitMs: 0, canPayNow: true, needsMultipleRuns: false,
      };
    }

    let requiredExp = remainingCurrentLevel;
    for (let level = currentLevel + 1; level < targetLevel; level += 1) {
      const levelXp = tableValue(table, level);
      if (levelXp === null) {
        return level === targetLevel - 1
          ? { valid: false, error: `当前经验表暂不支持计算到 Lv. ${targetLevel}，请补充等级经验数据。` }
          : { valid: false, error: `经验表缺少 Lv. ${level} 到下一级的数据。` };
      }
      requiredExp += levelXp;
    }
    const requiredAp = Math.ceil(requiredExp / expPerAp);
    const waitAp = Math.max(0, requiredAp - currentAp);
    const paused = rules && rules.isOperating === false && waitAp > 0;
    if (paused) {
      return {
        valid: true, reached: false, currentLevel, targetLevel, currentExp, currentLevelXp,
        remainingCurrentLevel, requiredExp, requiredAp, currentAp, apCap, expPerAp, waitAp,
        waitMs: null, canPayNow: false, needsMultipleRuns: currentAp < requiredAp && requiredAp > apCap, paused,
      };
    }
    const waitMs = waitAp * rules.apRecoveryMinutes * 60 * 1000;
    return {
      valid: true, reached: false, currentLevel, targetLevel, currentExp, currentLevelXp,
      remainingCurrentLevel, requiredExp, requiredAp, currentAp, apCap, expPerAp, waitAp, waitMs,
      canPayNow: currentAp >= requiredAp, needsMultipleRuns: currentAp < requiredAp && requiredAp > apCap,
    };
  }

  return { calculate, validateInput };
});
