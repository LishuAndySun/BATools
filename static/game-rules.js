/* User-editable game rules. Unknown level data is intentionally left empty. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GameRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const gameRules = {
    apRecoveryMinutes: 6,
    playerExpPerAp: 1,
    expTable: {},
    expTableVersion: "未配置",
    expTableSource: "未提供未经核实的官方等级经验表；请导入或编辑经验数据。",
    updatedAt: "未配置",
  };

  function cloneRules() {
    return {
      ...gameRules,
      expTable: { ...gameRules.expTable },
    };
  }

  return { gameRules, cloneRules };
});
