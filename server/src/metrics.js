/**
 * Aggregates raw request results into 1-second time-series windows.
 *
 * Bandwidth (từ góc nhìn server):
 *   downloadMbps  = bytes server gửi ra (server → client)
 *   uploadMbps    = bytes server nhận vào (client → server)
 *   bandwidthMbps = tổng throughput NIC
 *
 * Không cần user cấu hình NIC speed — hệ thống tự ước lượng từ đo lường thực tế.
 */

class MetricsWindow {
  constructor() {
    this._samples = [];
    this._windowStart = Date.now();
  }

  push(result) {
    this._samples.push(result);
  }

  flush(currentUsers) {
    const now = Date.now();
    const elapsed = (now - this._windowStart) / 1000 || 1;
    const samples = this._samples.splice(0);
    this._windowStart = now;

    const total      = samples.length;
    const failedSamples = samples.filter((s) => !s.success);
    const errors     = failedSamples.length;
    const successful = samples.filter((s) => s.success);

    // Collect top error messages for diagnostics (up to 3 unique messages)
    const errorMsgs = [...new Set(failedSamples.map(s => s.error).filter(Boolean))].slice(0, 3);
    const durations = successful.map((s) => s.durationMs).sort((a, b) => a - b);

    const downloadBytes = samples.reduce((sum, s) => sum + (s.bytes || 0), 0);
    const uploadBytes   = samples.reduce((sum, s) => sum + (s.sentBytes || 0), 0);
    const totalBytes    = downloadBytes + uploadBytes;

    const rps           = total / elapsed;
    const downloadMbps  = (downloadBytes * 8) / (elapsed * 1_000_000);
    const uploadMbps    = (uploadBytes   * 8) / (elapsed * 1_000_000);
    const bandwidthMbps = downloadMbps + uploadMbps;

    const p50 = percentile(durations, 0.5);
    const p95 = percentile(durations, 0.95);
    const p99 = percentile(durations, 0.99);
    const avgLatency = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      timestamp:    now,
      rps:          r(rps, 1),
      activeUsers:  currentUsers,
      downloadMbps: r(downloadMbps, 2),
      uploadMbps:   r(uploadMbps,   2),
      bandwidthMbps:r(bandwidthMbps,2),
      totalBytes,
      downloadBytes,
      uploadBytes,
      latency: {
        avg: Math.round(avgLatency),
        p50: p50 ?? 0,
        p95: p95 ?? 0,
        p99: p99 ?? 0,
      },
      errorRate:    total > 0 ? r((errors / total) * 100, 1) : 0,
      requestCount: total,
      errorCount:   errors,
      errorMsgs,   // top unique error messages for UI diagnostics
    };
  }
}

function r(n, digits) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Ước lượng dung lượng từ dữ liệu đo thực tế — không dùng NIC speed do user cấu hình.
 *
 * peakBandwidthMbps (đo được) = cận dưới của NIC thực tế.
 * Từ đó suy ra: số user tối đa mà throughput này có thể hỗ trợ,
 * và băng thông NIC cần thiết để đạt 300.000 user.
 */
function computeCapacityReport(windows, { maxUsers }) {
  if (windows.length === 0) return null;

  const trimmed = windows.slice(
    Math.floor(windows.length * 0.1),
    Math.ceil(windows.length * 0.9)
  );
  if (trimmed.length === 0) return null;

  const peakRps           = Math.max(...trimmed.map((w) => w.rps));
  const peakBandwidthMbps = Math.max(...trimmed.map((w) => w.bandwidthMbps));
  const peakDownloadMbps  = Math.max(...trimmed.map((w) => w.downloadMbps));
  const peakUploadMbps    = Math.max(...trimmed.map((w) => w.uploadMbps));
  const maxLatencyP95     = Math.max(...trimmed.map((w) => w.latency.p95));

  // ── Phát hiện bão hòa (3 tín hiệu độc lập) ────────────────
  const errorSatIdx   = trimmed.findIndex((w) => w.errorRate > 5);
  const latencySatIdx = trimmed.findIndex((w) => w.latency.p95 > 2000);
  const plateauIdx    = detectRpsPlateau(trimmed);

  const satCandidates  = [errorSatIdx, latencySatIdx, plateauIdx].filter((i) => i >= 0);
  const saturated      = satCandidates.length > 0;
  const saturationIdx  = saturated ? Math.min(...satCandidates) : -1;
  const saturationUsers = saturated ? trimmed[saturationIdx].activeUsers : maxUsers;

  let saturationCause = null;
  if (saturated) {
    if (saturationIdx === errorSatIdx)   saturationCause = 'error_rate';
    else if (saturationIdx === latencySatIdx) saturationCause = 'latency';
    else                                 saturationCause = 'rps_plateau';
  }

  // ── Ước lượng dung lượng từ throughput đo được ─────────────
  const totalSamples  = trimmed.reduce((s, w) => s + w.requestCount, 0);
  const totalBytes    = trimmed.reduce((s, w) => s + w.totalBytes, 0);
  const avgBytesPerReq = totalSamples > 0 ? totalBytes / totalSamples : 0;

  const peakActiveUsers   = trimmed[trimmed.length - 1]?.activeUsers || maxUsers;
  const reqPerUserPerSec  = peakRps / Math.max(1, peakActiveUsers);
  // băng thông mỗi người dùng (Mbps): bytes × 8 bits / 1M
  const bwPerUserMbps     = (avgBytesPerReq * 8 * reqPerUserPerSec) / 1_000_000;

  // Số user tối đa mà throughput đo được có thể hỗ trợ
  // (dùng peakBandwidthMbps thay cho NIC speed do user cấu hình)
  const bwLimitedUsers = bwPerUserMbps > 0
    ? Math.floor(peakBandwidthMbps / bwPerUserMbps)
    : Infinity;

  const estimatedMaxUsers = saturated
    ? saturationUsers
    : (isFinite(bwLimitedUsers) ? Math.min(maxUsers, bwLimitedUsers) : maxUsers);

  // ── Ước lượng NIC cần thiết cho 300.000 user ───────────────
  const targetUsers = 300_000;
  const scaleFactor = estimatedMaxUsers > 0 ? targetUsers / estimatedMaxUsers : null;
  // băng thông NIC cần: bwPerUserMbps × 300K → đổi sang Gbps
  const recommendedNicGbps = bwPerUserMbps > 0
    ? Math.ceil((bwPerUserMbps * targetUsers) / 1000)
    : null;

  return {
    peakRps,
    peakBandwidthMbps,
    peakDownloadMbps,
    peakUploadMbps,
    maxLatencyP95,
    saturated,
    saturationUsers,
    saturationCause,
    estimatedMaxUsers:  Math.round(estimatedMaxUsers),
    bwLimitedUsers:     isFinite(bwLimitedUsers) ? Math.round(bwLimitedUsers) : null,
    avgBytesPerRequest: Math.round(avgBytesPerReq),
    bwPerUserMbps:      r(bwPerUserMbps, 4),
    recommendedNicGbps,
    scaleFactor:        scaleFactor ? r(scaleFactor, 1) : null,
  };
}

function detectRpsPlateau(windows) {
  const span = 5;
  for (let i = span; i < windows.length; i++) {
    const prev = windows[i - span];
    const curr = windows[i];
    if (prev.activeUsers === 0 || prev.rps === 0 || curr.activeUsers === 0) continue;
    const userGrowth = (curr.activeUsers - prev.activeUsers) / prev.activeUsers;
    const rpsGrowth  = Math.abs(curr.rps - prev.rps) / prev.rps;
    if (userGrowth > 0.15 && rpsGrowth < 0.05) return i;
  }
  return -1;
}

module.exports = { MetricsWindow, computeCapacityReport };
