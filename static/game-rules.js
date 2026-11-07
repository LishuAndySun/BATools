/* User-editable game rules. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GameRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const gameRules = {
    cafeRanks: {
      1: { maxComfort: 1000, maxApPerHour: 3.83, apCap: 90 },
      2: { maxComfort: 1500, maxApPerHour: 6.36, apCap: 150 },
      3: { maxComfort: 2000, maxApPerHour: 9.29, apCap: 220 },
      4: { maxComfort: 2500, maxApPerHour: 12.62, apCap: 300 },
      5: { maxComfort: 3000, maxApPerHour: 16.36, apCap: 390 },
      6: { maxComfort: 3500, maxApPerHour: 19.49, apCap: 460 },
      7: { maxComfort: 4000, maxApPerHour: 22.32, apCap: 530 },
      8: { maxComfort: 4500, maxApPerHour: 25.15, apCap: 600 },
      9: { maxComfort: 5000, maxApPerHour: 27.97, apCap: 670 },
      10: { maxComfort: 5500, maxApPerHour: 30.8, apCap: 740 },
    },
    playerExpPerAp: 1,
    expTable: {
      1: 8, 2: 10, 3: 15, 4: 21, 5: 28, 6: 36, 7: 45, 8: 55, 9: 66, 10: 79,
      11: 93, 12: 108, 13: 124, 14: 141, 15: 159, 16: 178, 17: 198, 18: 219, 19: 241, 20: 265,
      21: 288, 22: 312, 23: 337, 24: 363, 25: 390, 26: 418, 27: 447, 28: 477, 29: 508, 30: 581,
      31: 658, 32: 734, 33: 814, 34: 897, 35: 982, 36: 1069, 37: 1159, 38: 1251, 39: 1346, 40: 1443,
      41: 1543, 42: 1645, 43: 1750, 44: 1857, 45: 1966, 46: 2078, 47: 2192, 48: 2309, 49: 2428, 50: 2550,
      51: 2674, 52: 2800, 53: 2929, 54: 3060, 55: 3194, 56: 3330, 57: 3469, 58: 3610, 59: 3754, 60: 3900,
      61: 4048, 62: 4199, 63: 4352, 64: 4508, 65: 4666, 66: 4831, 67: 5007, 68: 5186, 69: 5369, 70: 5556,
      71: 5747, 72: 5942, 73: 6141, 74: 6344, 75: 6552, 76: 6768, 77: 6989, 78: 7216, 79: 7449, 80: 7682,
      81: 7915, 82: 8148, 83: 8381, 84: 8883, 85: 9460, 86: 10614, 87: 12922, 88: 17538, 89: 26770,
    },
    expTableVersion: "内置经验表",
    expTableSource: "用户提供",
    updatedAt: "2026-11-06",
  };

  function cloneRules() {
    return {
      ...gameRules,
      cafeRanks: { ...gameRules.cafeRanks },
      expTable: { ...gameRules.expTable },
    };
  }

  function cafeProduction(rank, comfort) {
    const rankRules = gameRules.cafeRanks[rank];
    const currentComfort = Number(comfort);
    if (!rankRules || !Number.isFinite(currentComfort) || currentComfort < 0) return null;
    const comfortRatio = Math.min(1, currentComfort / rankRules.maxComfort);
    return {
      ...rankRules,
      rank: Number(rank),
      currentComfort,
      comfortRatio,
      apPerHour: rankRules.maxApPerHour * comfortRatio,
    };
  }

  function playerApCap(level) {
    const currentLevel = Number(level);
    if (!Number.isInteger(currentLevel) || currentLevel < 1 || currentLevel > 90) return null;
    return currentLevel <= 20
      ? 24 + (currentLevel - 1) * 4
      : 100 + (currentLevel - 20) * 2;
  }

  return { gameRules, cloneRules, cafeProduction, playerApCap };
});
