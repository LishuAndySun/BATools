(() => {
  const calculator = window.ActionPointCalculator;
  const levelCalculator = window.LevelCalculator;
  const defaultRules = window.GameRules.cloneRules();
  const storageKey = "ba-action-point-state";
  const levelStorageKey = "ba-level-target-state";
  const rulesStorageKey = "ba-game-rules";
  const elements = {
    form: document.querySelector("#point-form"),
    points: document.querySelector("#points"),
    cap: document.querySelector("#cap"),
    recordedAt: document.querySelector("#recorded-at"),
    error: document.querySelector("#form-error"),
    current: document.querySelector("#current-points"),
    recovered: document.querySelector("#recovered"),
    countdown: document.querySelector("#countdown"),
    nextTime: document.querySelector("#next-time"),
    currentCap: document.querySelector("#current-cap"),
    progress: document.querySelector("#progress-bar"),
    capMessage: document.querySelector("#cap-message"),
    alert: document.querySelector("#alert-message"),
    notifyButton: document.querySelector("#notification-button"),
    notifyStatus: document.querySelector("#notification-status"),
    levelForm: document.querySelector("#level-form"),
    levelCurrent: document.querySelector("#level-current"),
    levelExp: document.querySelector("#level-exp"),
    levelTarget: document.querySelector("#level-target"),
    levelAp: document.querySelector("#level-ap"),
    levelCap: document.querySelector("#level-cap"),
    levelExpPerAp: document.querySelector("#level-exp-per-ap"),
    levelError: document.querySelector("#level-error"),
    levelCurrentResult: document.querySelector("#level-current-result"),
    levelTargetResult: document.querySelector("#level-target-result"),
    levelExpResult: document.querySelector("#level-exp-result"),
    levelRequiredExp: document.querySelector("#level-required-exp"),
    levelRateResult: document.querySelector("#level-rate-result"),
    levelRequiredAp: document.querySelector("#level-required-ap"),
    levelApResult: document.querySelector("#level-ap-result"),
    levelWaitAp: document.querySelector("#level-wait-ap"),
    levelStatus: document.querySelector("#level-status"),
    levelReadyTime: document.querySelector("#level-ready-time"),
    levelWaitTime: document.querySelector("#level-wait-time"),
    rulesMeta: document.querySelector("#rules-meta"),
    rulesJson: document.querySelector("#exp-table-json"),
    rulesFile: document.querySelector("#exp-table-file"),
    applyRules: document.querySelector("#apply-rules"),
    rulesError: document.querySelector("#rules-error"),
  };
  let state = loadState();
  let levelState = loadStored(levelStorageKey);
  let rules = loadRules();
  let lastReminderAt = null;
  let titleTimer = null;
  const originalTitle = document.title;

  function localDateValue(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved && typeof saved === "object" ? saved : null;
    } catch (_) { return null; }
  }

  function loadStored(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  }

  function loadRules() {
    const saved = loadStored(rulesStorageKey);
    return saved && typeof saved === "object" ? { ...defaultRules, ...saved, expTable: { ...defaultRules.expTable, ...(saved.expTable || {}) } } : defaultRules;
  }

  function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function saveLevelState() { localStorage.setItem(levelStorageKey, JSON.stringify(levelState)); }
  function saveRules() { localStorage.setItem(rulesStorageKey, JSON.stringify(rules)); }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")} 分 ${String(seconds).padStart(2, "0")} 秒`;
  }

  function formatDate(timestamp) {
    return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(timestamp));
  }

  function renderEmpty() {
    elements.current.textContent = "--";
    elements.recovered.textContent = "--";
    elements.countdown.textContent = "--";
    elements.nextTime.textContent = "--";
    elements.currentCap.textContent = "--";
    elements.progress.style.width = "0%";
    elements.capMessage.classList.add("hidden");
  }

  function render() {
    if (!state) { renderEmpty(); return; }
    const result = calculator.calculate({ ...state, now: Date.now() });
    if (!result.valid) { renderEmpty(); elements.error.textContent = result.error; return; }
    elements.current.textContent = result.currentPoints;
    elements.recovered.textContent = `+${result.recovered}`;
    elements.currentCap.textContent = result.cap;
    elements.progress.style.width = `${Math.min(100, result.progress * 100)}%`;
    elements.countdown.textContent = result.atCap ? "已达上限" : formatDuration(result.remainingMs);
    elements.nextTime.textContent = result.atCap ? "暂停恢复" : formatDate(result.nextRecoveryAt);
    elements.capMessage.classList.toggle("hidden", !result.atCap);
    elements.capMessage.textContent = result.atCap ? "行动点已达到上限，计时已暂停。重新记录后会开始新的预测。" : "";
    updateReminder(result);
  }

  function updateReminder(result) {
    if (!result.valid || result.atCap || result.nextRecoveryAt > Date.now()) return;
    if (lastReminderAt === result.nextRecoveryAt) return;
    lastReminderAt = result.nextRecoveryAt;
    elements.alert.classList.remove("hidden");
    elements.alert.textContent = "行动点已恢复，请回来查看当前数值。";
    document.body.classList.add("attention");
    startTitleFlash();
    if ("Notification" in window && Notification.permission === "granted") new Notification("行动点已恢复", { body: "你的行动点已恢复 1 点。" });
  }

  function startTitleFlash() {
    if (titleTimer) return;
    let showing = false;
    titleTimer = setInterval(() => {
      document.title = showing ? originalTitle : "行动点已恢复 · 工具箱";
      showing = !showing;
    }, 900);
  }

  function updateNotificationStatus() {
    if (!("Notification" in window)) {
      elements.notifyStatus.textContent = "当前浏览器不支持通知。页面内提示和标题闪烁仍会工作。";
      elements.notifyButton.disabled = true;
      return;
    }
    const status = Notification.permission;
    if (status === "granted") {
      elements.notifyStatus.textContent = "浏览器通知已启用。页面保持打开时，恢复点会自动提醒。";
      elements.notifyButton.textContent = "通知已启用";
      elements.notifyButton.disabled = true;
    } else if (status === "denied") {
      elements.notifyStatus.textContent = "通知权限已被拒绝。请在浏览器网站设置中允许通知；页面内提醒仍会工作。";
    }
  }

  function levelInput() {
    return {
      currentLevel: elements.levelCurrent.value,
      currentExp: elements.levelExp.value,
      targetLevel: elements.levelTarget.value,
      currentAp: elements.levelAp.value,
      apCap: elements.levelCap.value,
      expPerAp: elements.levelExpPerAp.value,
    };
  }

  function renderLevelEmpty() {
    [elements.levelCurrentResult, elements.levelTargetResult, elements.levelExpResult, elements.levelRequiredExp,
      elements.levelRateResult, elements.levelRequiredAp, elements.levelApResult, elements.levelWaitAp].forEach((element) => { element.textContent = "--"; });
    elements.levelReadyTime.textContent = "--";
    elements.levelWaitTime.textContent = "预计等待时间：--";
    elements.levelStatus.classList.add("hidden");
  }

  function renderRulesMeta() {
    const count = Object.keys(rules.expTable || {}).length;
    elements.rulesMeta.textContent = `当前规则：1 AP = ${rules.playerExpPerAp} 玩家经验；经验表 ${count} 条；版本：${rules.expTableVersion}；来源：${rules.expTableSource}；更新时间：${rules.updatedAt}`;
    elements.rulesJson.value = JSON.stringify(rules.expTable, null, 2);
  }

  function renderLevel() {
    if (!levelState) { renderLevelEmpty(); return; }
    const result = levelCalculator.calculate(levelState, rules);
    if (!result.valid) {
      renderLevelEmpty();
      elements.levelError.textContent = result.error;
      return;
    }
    elements.levelError.textContent = "";
    elements.levelCurrentResult.textContent = `Lv. ${result.currentLevel}`;
    elements.levelTargetResult.textContent = `Lv. ${result.targetLevel}`;
    elements.levelExpResult.textContent = `${result.currentExp} / ${result.currentLevelXp}`;
    elements.levelRequiredExp.textContent = result.reached ? "0" : result.requiredExp;
    elements.levelRateResult.textContent = result.expPerAp;
    elements.levelRequiredAp.textContent = `${result.requiredAp} AP`;
    elements.levelApResult.textContent = `${result.currentAp} / ${result.apCap} AP`;
    elements.levelWaitAp.textContent = `${result.waitAp} AP`;
    elements.levelStatus.classList.remove("hidden");
    if (result.reached) {
      elements.levelStatus.textContent = `你已经达到目标等级。当前等级还剩 ${result.remainingCurrentLevel} 经验可以升级。`;
      elements.levelReadyTime.textContent = "已达到目标";
      elements.levelWaitTime.textContent = "预计等待时间：无需等待";
      return;
    }
    const waitDate = new Date(Date.now() + result.waitMs);
    elements.levelReadyTime.textContent = result.canPayNow ? "现在即可消耗" : (result.needsMultipleRuns ? "无法一次凑够，需分次消耗" : waitDate.toLocaleString("zh-CN", { hour12: false }));
    elements.levelWaitTime.textContent = `预计等待时间：${formatDuration(result.waitMs)}${result.needsMultipleRuns ? "；需求超过行动点上限，需要分次消耗" : ""}`;
    elements.levelStatus.textContent = result.canPayNow ? "当前行动点足够达到目标等级。" : `当前行动点不足，还需要自然恢复 ${result.waitAp} AP。`;
  }

  function applyRulesFromText() {
    try {
      const parsed = JSON.parse(elements.rulesJson.value);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("经验表必须是 JSON 对象。");
      const normalized = {};
      for (const [level, value] of Object.entries(parsed)) {
        if (!/^\d+$/.test(level) || Number(level) < 1 || !Number.isInteger(Number(value)) || Number(value) <= 0) throw new Error("等级键必须是正整数，经验值必须是正整数。");
        normalized[level] = Number(value);
      }
      rules = { ...rules, expTable: normalized, expTableVersion: "用户自定义", expTableSource: "用户在浏览器中导入或编辑", updatedAt: new Date().toISOString() };
      saveRules();
      elements.rulesError.textContent = "";
      renderRulesMeta();
      renderLevel();
    } catch (error) { elements.rulesError.textContent = `经验表格式错误：${error.message}`; }
  }

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const points = Number(elements.points.value);
    const cap = Number(elements.cap.value);
    if (!elements.points.value.trim() || !elements.cap.value.trim() || !Number.isInteger(points) || points < 0 || !Number.isInteger(cap) || cap < 0) {
      elements.error.textContent = "请输入不小于 0 的整数。";
      return;
    }
    state = { recordedPoints: points, cap, recordedAt: new Date(elements.recordedAt.value).getTime() };
    if (!Number.isFinite(state.recordedAt)) { elements.error.textContent = "请选择有效的记录时间。"; return; }
    lastReminderAt = null;
    elements.error.textContent = "";
    saveState();
    render();
  });

  elements.notifyButton.addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    updateNotificationStatus();
    if (permission === "granted") elements.alert.classList.add("hidden");
  });

  elements.levelForm.addEventListener("submit", (event) => {
    event.preventDefault();
    levelState = levelInput();
    saveLevelState();
    renderLevel();
  });
  elements.applyRules.addEventListener("click", applyRulesFromText);
  elements.rulesFile.addEventListener("change", () => {
    const file = elements.rulesFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => { elements.rulesJson.value = reader.result; applyRulesFromText(); });
    reader.addEventListener("error", () => { elements.rulesError.textContent = "无法读取经验表文件。"; });
    reader.readAsText(file);
  });

  elements.recordedAt.value = localDateValue(new Date());
  if (state) {
    elements.points.value = state.recordedPoints;
    elements.cap.value = state.cap;
    elements.recordedAt.value = localDateValue(new Date(state.recordedAt));
  }
  if (levelState) Object.entries(levelState).forEach(([key, value]) => { const element = elements[`level${key[0].toUpperCase()}${key.slice(1)}`]; if (element) element.value = value; });
  if (!levelState) elements.levelExpPerAp.value = rules.playerExpPerAp;
  updateNotificationStatus();
  renderRulesMeta();
  render();
  renderLevel();
  setInterval(() => { render(); renderLevel(); }, 1000);
})();
