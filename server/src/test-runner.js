const { EventEmitter } = require('events');
const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');
const { MetricsWindow, computeCapacityReport } = require('./metrics');

const WORKER_FILE = path.join(__dirname, 'request-worker.js');

class TestRunner extends EventEmitter {
  constructor({ url, maxUsers, duration, rampTime, method, thinkTime, body, payloadSizeBytes }) {
    super();
    // Prevent EventEmitter from throwing when no external 'error' listener registered
    this.on('error', (err) => console.error('[TestRunner] error:', err));

    this.url = url;
    this.maxUsers = maxUsers;
    this.duration = duration;
    this.rampTime = Math.min(rampTime, duration * 0.8);
    this.method = method;
    this.thinkTime = thinkTime;
    this.body            = body            ?? null;
    this.payloadSizeBytes= payloadSizeBytes ?? 0;

    this.running = false;
    this.workers = [];
    this.metricsWindow = new MetricsWindow();
    this.allWindows = [];
    this.currentUsers = 0;

    this._flushInterval = null;
    this._rampInterval = null;
    this._endTimeout = null;
    this._scaleTimeout = null; // single pending scale — prevents orphaned worker buildup
  }

  start() {
    this.running = true;
    const mem = process.memoryUsage();
    this._numWorkers = Math.min(os.cpus().length, 8);

    const rampSteps = 20;
    // Minimum 100 ms per step to avoid triggering faster than the 200 ms replacement delay
    const stepInterval = Math.max(Math.round((this.rampTime * 1000) / rampSteps), 100);
    const usersPerStep = Math.ceil(this.maxUsers / rampSteps);

    console.log(
      `[TestRunner] start — url=${this.url} maxUsers=${this.maxUsers} ` +
      `duration=${this.duration}s ramp=${this.rampTime}s heapUsed=${Math.round(mem.heapUsed / 1024 / 1024)}MB`
    );

    this._flushInterval = setInterval(() => {
      const snap = this.metricsWindow.flush(this.currentUsers);
      this.allWindows.push(snap);
      this.emit('metrics', snap);
    }, 1000);

    let step = 0;
    this._rampInterval = setInterval(() => {
      step++;
      const target = Math.min(step * usersPerStep, this.maxUsers);
      this._scaleToUsers(target);
      if (target >= this.maxUsers) {
        clearInterval(this._rampInterval);
        this._rampInterval = null;
      }
    }, stepInterval);

    this._endTimeout = setTimeout(() => this.stop(), this.duration * 1000);

    console.log(`[TestRunner] ${this._numWorkers} worker threads · step=${stepInterval}ms · ${usersPerStep} users/step`);
  }

  _spawnWorkers(count, vuPerWorker) {
    for (let i = 0; i < count; i++) {
      const worker = new Worker(WORKER_FILE, {
        workerData: { url: this.url, method: this.method, virtualUsers: vuPerWorker, thinkTime: this.thinkTime, body: this.body, payloadSizeBytes: this.payloadSizeBytes },
      });

      worker.on('message', (msg) => {
        if (msg.type === 'result') this.metricsWindow.push(msg);
      });

      worker.on('error', (err) => {
        console.error(`[Worker ${i}] error:`, err.message);
        this.emit('error', `Worker ${i} error: ${err.message}`);
      });

      worker.on('exit', (code) => {
        if (code !== 0) console.error(`[Worker ${i}] exited code=${code}`);
      });

      this.workers.push(worker);
    }
  }

  _scaleToUsers(targetUsers) {
    this.currentUsers = targetUsers;
    const vuPerWorker = Math.max(1, Math.ceil(targetUsers / this._numWorkers));

    // Cancel any pending replacement — only ONE scale operation in flight at a time
    if (this._scaleTimeout) {
      clearTimeout(this._scaleTimeout);
      this._scaleTimeout = null;
    }

    this.workers.forEach((w) => { try { w.postMessage({ type: 'stop' }); } catch {} });

    this._scaleTimeout = setTimeout(() => {
      this._scaleTimeout = null;
      if (!this.running) return;
      this.workers = [];
      this._spawnWorkers(this._numWorkers, vuPerWorker);
      console.log(`[TestRunner] scaled → ${targetUsers} users (${vuPerWorker} VU/worker × ${this._numWorkers})`);
    }, 200);
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    clearInterval(this._flushInterval);
    clearInterval(this._rampInterval);
    clearTimeout(this._endTimeout);
    if (this._scaleTimeout) { clearTimeout(this._scaleTimeout); this._scaleTimeout = null; }

    this.workers.forEach((w) => { try { w.postMessage({ type: 'stop' }); } catch {} });
    this.workers = [];

    console.log(`[TestRunner] stop — ${this.allWindows.length} windows collected`);

    const final = this.metricsWindow.flush(this.currentUsers);
    if (final.requestCount > 0) this.allWindows.push(final);

    const report = computeCapacityReport(this.allWindows, { maxUsers: this.maxUsers });

    this.emit('complete', { windows: this.allWindows, report, config: this._config() });
  }

  _config() {
    return { url: this.url, maxUsers: this.maxUsers, duration: this.duration, rampTime: this.rampTime, method: this.method };
  }
}

module.exports = { TestRunner };
