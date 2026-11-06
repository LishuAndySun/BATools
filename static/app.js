(() => {
  const calculator = window.ActionPointCalculator;
  const storageKey = "ba-action-point-state";
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
  };
  let state = loadState();
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

  function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }

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

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const points = Number(elements.points.value);
    const cap = Number(elements.cap.value);
    if (!Number.isInteger(points) || points < 0 || !Number.isInteger(cap) || cap < 0 || points > cap) {
      elements.error.textContent = "请输入不小于 0 的整数，且当前行动点不能超过上限。";
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

  elements.recordedAt.value = localDateValue(new Date());
  if (state) {
    elements.points.value = state.recordedPoints;
    elements.cap.value = state.cap;
    elements.recordedAt.value = localDateValue(new Date(state.recordedAt));
  }
  updateNotificationStatus();
  render();
  setInterval(render, 1000);
})();
