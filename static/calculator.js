/* Pure action point calculations, kept independent from the page UI. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ActionPointCalculator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MINUTE_MS = 60 * 1000;
  const RECOVERY_INTERVAL_MS = 6 * MINUTE_MS;
  const DEFAULT_CAP = 999;

  function finiteNumber(value) {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeCap(value) {
    const cap = finiteNumber(value);
    return cap !== null && cap >= 0 ? Math.floor(cap) : null;
  }

  function normalizePoints(value) {
    const points = finiteNumber(value);
    if (points === null || !Number.isInteger(points) || points < 0) return null;
    return points;
  }

  function calculate({ recordedPoints, recordedAt, cap = DEFAULT_CAP, apPerHour = 10, isOperating = true, now = Date.now() }) {
    const normalizedCap = normalizeCap(cap);
    const points = normalizePoints(recordedPoints);
    const hourlyRate = finiteNumber(apPerHour);
    const start = finiteNumber(recordedAt);
    const currentTime = finiteNumber(now);
    if (normalizedCap === null || points === null || hourlyRate === null || hourlyRate <= 0 || start === null || currentTime === null || start < 0) {
      return { valid: false, error: "请输入有效的行动点、上限和记录时间。" };
    }

    const recoveryIntervalMs = 60 * MINUTE_MS / hourlyRate;
    const safeNow = Math.max(currentTime, start);
    const elapsedMs = safeNow - start;
    const available = Math.max(0, normalizedCap - points);
    const recovered = isOperating ? Math.min(available, Math.floor(elapsedMs / recoveryIntervalMs)) : 0;
    const currentPoints = points + recovered;
    const atCap = currentPoints >= normalizedCap;
    const paused = !isOperating && !atCap;
    const nextRecoveryAt = atCap || paused
      ? null
      : start + (recovered + 1) * recoveryIntervalMs;
    const remainingMs = atCap || paused ? 0 : Math.max(0, nextRecoveryAt - safeNow);

    return {
      valid: true,
      recordedPoints: points,
      recordedAt: start,
      cap: normalizedCap,
      apPerHour: hourlyRate,
      isOperating,
      recoveryIntervalMs,
      recovered,
      currentPoints,
      atCap,
      paused,
      elapsedMs,
      nextRecoveryAt,
      remainingMs,
      progress: normalizedCap === 0 ? 1 : Math.min(1, currentPoints / normalizedCap),
    };
  }

  return { calculate, normalizeCap, normalizePoints, RECOVERY_INTERVAL_MS };
});
