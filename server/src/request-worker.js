/**
 * Worker thread: HTTP load generator.
 *
 * Core design: throughput is bounded by MAX_SOCKETS (TCP connections),
 * not by virtualUsers. Creating thousands of coroutines for thousands of
 * VUs causes thundering-herd OOM at high counts. Solution: cap coroutines
 * at MAX_SOCKETS — same throughput, bounded memory, no thundering herd.
 *
 * virtualUsers is still forwarded in reports for capacity extrapolation.
 */
const { workerData, parentPort } = require('worker_threads');
const https = require('https');
const http  = require('http');

const MAX_SOCKETS = 100; // max concurrent TCP connections per worker thread

const { url, method, virtualUsers, thinkTime, body, payloadSizeBytes } = workerData;

const CONCURRENT = Math.min(Math.max(virtualUsers, 1), MAX_SOCKETS);

const isHttps    = url.startsWith('https://');
const mod        = isHttps ? https : http;
const agent      = isHttps
  ? new https.Agent({ keepAlive: true, maxSockets: CONCURRENT })
  : new http.Agent({  keepAlive: true, maxSockets: CONCURRENT });

function doRequest(bodyBuffer) {
  return new Promise((resolve) => {
    const start     = Date.now();
    // Only count body bytes — not HTTP header overhead.
    // Headers (~250B) on loopback inflate "upload" to fake tens-of-Gbps
    // because millions of GET requests/sec × 250B = meaningless Gbps figure.
    // Real bandwidth = actual payload bytes crossing the wire.
    const sentBytes = bodyBuffer ? bodyBuffer.length : 0;
    const options   = { method: method || 'GET', agent };

    if (bodyBuffer) {
      options.headers = {
        'Content-Type':   'application/json',
        'Content-Length': bodyBuffer.length,
      };
    }

    try {
      const req = mod.request(url, options, (res) => {
        let bytes = 0;
        res.on('data',  (c) => { bytes += c.length; });
        res.on('end',   () => resolve({ success: true,  statusCode: res.statusCode, durationMs: Date.now() - start, bytes, sentBytes }));
        res.on('error', (e) => resolve({ success: false, error: e.message,           durationMs: Date.now() - start, bytes, sentBytes }));
      });
      req.on('error', (e) => resolve({ success: false, error: e.message, durationMs: Date.now() - start, bytes: 0, sentBytes }));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ success: false, error: 'timeout', durationMs: Date.now() - start, bytes: 0, sentBytes });
      });
      if (bodyBuffer) req.write(bodyBuffer);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message, durationMs: Date.now() - start, bytes: 0, sentBytes });
    }
  });
}

async function runConnection(bodyBuffer, stopSignal) {
  let errStreak = 0;

  while (!stopSignal.stop) {
    const result = await doRequest(bodyBuffer);

    try {
      parentPort.postMessage({ type: 'result', ...result });
    } catch {
      return; // parent channel closed — exit cleanly
    }

    if (!result.success) {
      errStreak++;
      // Exponential back-off on consecutive failures, capped at 200ms
      if (errStreak > 2) {
        await new Promise((r) => setTimeout(r, Math.min(errStreak * 20, 200)));
      }
    } else {
      errStreak = 0;
    }

    if (thinkTime > 0) {
      await new Promise((r) => setTimeout(r, thinkTime));
    }
  }
}

const stopSignal = { stop: false };

// Payload resolution: auto-generated size takes priority over manual body.
// Generated here in the worker (not in the parent) to avoid cloning large
// strings via workerData on every _spawnWorkers call.
let bodyBuffer = null;
if (payloadSizeBytes > 0) {
  const prefix    = '{"data":"';
  const suffix    = '"}';
  const dataLen   = Math.max(0, payloadSizeBytes - prefix.length - suffix.length);
  bodyBuffer = Buffer.from(prefix + 'x'.repeat(dataLen) + suffix, 'utf8');
} else if (body) {
  bodyBuffer = Buffer.from(body, 'utf8');
}

parentPort.on('message', (msg) => {
  if (msg.type === 'stop') stopSignal.stop = true;
});

// Stagger startup: 10ms per coroutine → max 1000ms total startup regardless of VU count
const promises = [];
for (let i = 0; i < CONCURRENT; i++) {
  promises.push(
    new Promise((r) => setTimeout(r, i * 10)).then(() =>
      runConnection(bodyBuffer, stopSignal)
    )
  );
}

Promise.all(promises)
  .catch(() => {})
  .then(() => {
    agent.destroy();
    try { parentPort.postMessage({ type: 'done' }); } catch {}
  });
