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

  function normalizePoints(value, cap) {
    const points = finiteNumber(value);
    if (points === null || !Number.isInteger(points) || points < 0 || cap === null || points > cap) return null;
    return points;
  }

  function calculate({ recordedPoints, recordedAt, cap = DEFAULT_CAP, now = Date.now() }) {
    const normalizedCap = normalizeCap(cap);
    const points = normalizePoints(recordedPoints, normalizedCap);
    const start = finiteNumber(recordedAt);
    const currentTime = finiteNumber(now);
    if (normalizedCap === null || points === null || start === null || currentTime === null || start < 0) {
      return { valid: false, error: "请输入有效的行动点、上限和记录时间。" };
    }

    const safeNow = Math.max(currentTime, start);
    const elapsedMs = safeNow - start;
    const available = normalizedCap - points;
    const recovered = Math.min(available, Math.floor(elapsedMs / RECOVERY_INTERVAL_MS));
    const currentPoints = points + recovered;
    const atCap = currentPoints >= normalizedCap;
    const nextRecoveryAt = atCap
      ? null
      : start + (recovered + 1) * RECOVERY_INTERVAL_MS;
    const remainingMs = atCap ? 0 : Math.max(0, nextRecoveryAt - safeNow);

    return {
      valid: true,
      recordedPoints: points,
      recordedAt: start,
      cap: normalizedCap,
      recovered,
      currentPoints,
      atCap,
      elapsedMs,
      nextRecoveryAt,
      remainingMs,
      progress: normalizedCap === 0 ? 1 : currentPoints / normalizedCap,
    };
  }

  return { calculate, normalizeCap, normalizePoints, RECOVERY_INTERVAL_MS };
});
