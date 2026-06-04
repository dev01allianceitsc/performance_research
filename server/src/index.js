const express = require('express');
const http    = require('http');
const { WebSocketServer } = require('ws');
const cors    = require('cors');
const path    = require('path');
const { TestRunner } = require('./test-runner');

// --- Global error catchers ---
// Use console.log (stdout) so logs are always visible regardless of terminal stderr handling.

process.on('uncaughtException', (err) => {
  // Fatal: only exit for errors that make the server unusable
  console.error('[CRASH] uncaughtException:', err.stack || err);
  if (['EADDRINUSE', 'EACCES'].includes(err.code)) process.exit(1);
  // Otherwise log and continue — don't kill the server over a single bad callback
});

process.on('unhandledRejection', (reason) => {
  // Non-fatal: log and continue. Killing the server on every Promise rejection
  // is too aggressive — a failed metric broadcast or a socket error shouldn't
  // take down the whole load test.
  console.error('[WARN] unhandledRejection:', reason?.stack || reason);
});

process.on('SIGTERM', () => { console.log('[SIGNAL] SIGTERM'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[SIGNAL] SIGINT');  process.exit(0); });
process.on('beforeExit', (c) => console.log(`[DRAIN] event loop empty, code=${c}`));
process.on('exit', (c) => {
  const m = process.memoryUsage();
  console.log(`[EXIT] code=${c} heap=${Math.round(m.heapUsed/1024/1024)}MB`);
});

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

// CORS — allow Vercel frontend or wildcard
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PUT', 'OPTIONS'] }));

const PUBLIC_DIR = path.join(__dirname, '../public');
app.use(express.static(PUBLIC_DIR));

// --- WebSocket ---
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});
function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach((ws) => { if (ws.readyState === 1) ws.send(msg); });
}

// --- Test state ---
let currentRunner = null;

// ─────────────────────────────────────────────────────────────────────────────
// /api/bench  — Benchmark target endpoint.
//
// Designed to be the TARGET URL when you want to load-test this server itself.
// Accepts any method + any payload without JSON parsing (drain & discard body).
// Optional query params:
//   ?size=N  — respond with N bytes of JSON data (tests download bandwidth)
//
// Example: http://localhost:3001/api/bench?size=10240
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// /api/bench/download?bytes=N  — saturate the pipe with N bytes per connection.
// Unlike /api/bench which returns a small JSON, this streams raw bytes as fast
// as the NIC allows. Use this to measure true download bandwidth.
//   Default: 10 MB per connection. Max: 500 MB.
// ─────────────────────────────────────────────────────────────────────────────
const BENCH_CHUNK = Buffer.alloc(64 * 1024, 0x41); // 64 KB reusable chunk ('A')

app.get('/api/bench/download', (req, res) => {
  const totalBytes = Math.min(parseInt(req.query.bytes) || 10 * 1024 * 1024, 500 * 1024 * 1024);
  let sent = 0;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', totalBytes);
  res.setHeader('Cache-Control', 'no-store');

  const pump = () => {
    while (sent < totalBytes) {
      const remaining  = totalBytes - sent;
      const chunk      = remaining >= BENCH_CHUNK.length ? BENCH_CHUNK : BENCH_CHUNK.slice(0, remaining);
      const ok         = res.write(chunk);
      sent            += chunk.length;
      if (!ok) { res.once('drain', pump); return; }
    }
    res.end();
  };
  pump();
});

// /api/bench/upload  — receive a streaming upload, drain and ack.
// Use this to measure true upload bandwidth (POST with large body).
app.post('/api/bench/upload', (req, res) => {
  let received = 0;
  req.on('data', (c) => { received += c.length; });
  req.on('end',  ()  => res.json({ ok: true, received }));
  req.on('error',()  => res.json({ ok: false, received }));
});

app.all('/api/bench', (req, res) => {
  const size = parseInt(req.query.size) || 0;

  // Respond immediately — don't wait for body drain.
  // For GET this is always safe. For POST with large body, HTTP/1.1 keepalive
  // reuse will handle draining the body on the socket level.
  if (size > 0) {
    const cap    = Math.min(size, 10 * 1024 * 1024); // cap at 10 MB
    const prefix = '{"ok":true,"data":"';
    const suffix = '"}';
    const pad    = Math.max(0, cap - prefix.length - suffix.length);
    res.setHeader('Content-Type', 'application/json');
    res.end(prefix + 'x'.repeat(pad) + suffix);
  } else {
    res.json({ ok: true, ts: Date.now() });
  }

  // Drain any request body after responding to allow keepalive socket reuse
  req.resume();
});

// ─────────────────────────────────────────────────────────────────────────────
// Control API — express.json() scoped only to these routes so that
// incoming test traffic (workers hitting the server) never triggers the body
// parser and can't cause PayloadTooLargeError.
// ─────────────────────────────────────────────────────────────────────────────
const parseJson = express.json({ limit: '50kb' }); // config payloads are always tiny

app.post('/api/test/start', parseJson, (req, res) => {
  const { url, maxUsers, duration, rampTime, method, thinkTime, body, payloadSizeBytes } = req.body || {};

  if (!url) return res.status(400).json({ error: 'URL required' });
  if (currentRunner?.running) return res.status(409).json({ error: 'Test already running' });

  currentRunner = new TestRunner({
    url,
    maxUsers:        parseInt(maxUsers)        || 100,
    duration:        parseInt(duration)        || 60,
    rampTime:        parseInt(rampTime)        || 15,
    method:          method                    || 'GET',
    thinkTime:       parseInt(thinkTime)       || 0,
    body:            body                      || null,
    payloadSizeBytes:parseInt(payloadSizeBytes)|| 0,
  });

  currentRunner.on('metrics',  (data)    => broadcast({ type: 'metrics',  data }));
  currentRunner.on('complete', (summary) => broadcast({ type: 'complete', data: summary }));
  currentRunner.on('error',    (err)     => broadcast({ type: 'error',    data: { message: err } }));

  currentRunner.start();
  res.json({ status: 'started' });
});

app.post('/api/test/stop', (req, res) => {
  if (currentRunner?.running) {
    currentRunner.stop();
    res.json({ status: 'stopped' });
  } else {
    res.status(400).json({ error: 'No test running' });
  }
});

app.get('/api/test/status', (req, res) => {
  res.json({ running: currentRunner?.running ?? false });
});

// Return server's own network interfaces so the UI can suggest LAN IP targets
app.get('/api/network-info', (req, res) => {
  const os = require('os');
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 only, skip loopback
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, address: net.address });
      }
    }
  }
  const port = process.env.PORT || 3001;
  res.json({ ips, port });
});

// SPA fallback
app.get('*', (req, res) => {
  const index = path.join(PUBLIC_DIR, 'index.html');
  res.sendFile(index, (err) => {
    if (err) res.status(200).send('Server Bench running.');
  });
});

// Express error handler — catches any middleware errors (e.g. body-parser) gracefully
// Must have exactly 4 parameters for Express to recognise it as an error handler
app.use((err, req, res, _next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  console.error(`[HTTP ${status}] ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[ERROR] Port ${PORT} already in use.`);
    process.exit(1);
  }
  throw err;
});
// Simple ping endpoint — use to test connectivity from another machine
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now(), from: req.ip });
});

server.listen(PORT, () => {
  const os   = require('os');
  const nets = os.networkInterfaces();
  const ips  = [];
  for (const ifaces of Object.values(nets)) {
    for (const n of ifaces) {
      if (n.family === 'IPv4' && !n.internal) ips.push(n.address);
    }
  }

  console.log(`\nServer Bench running → http://localhost:${PORT}`);
  if (ips.length) {
    console.log(`LAN access           → ${ips.map(ip => `http://${ip}:${PORT}`).join('\n                       ')}`);
  }
  console.log(`\n─── Nếu máy khác bị lỗi 100% → Firewall đang chặn port ${PORT} ───`);
  console.log(`Chạy lệnh sau với quyền Admin để mở port (Windows):`);
  console.log(`  netsh advfirewall firewall add rule name="Server-Bench" dir=in action=allow protocol=TCP localport=${PORT}\n`);
});
