// Kryos SDK initialization helper for the demo backend (dkryos-backend)
// Handles parsing env, initializing the SDK, and exposing helper methods.
// This file uses dynamic import because the SDK is ESM (type: module) while this backend uses CommonJS.

let kryos = null;
// Simple in-memory queue for events when SDK or network is unavailable
const queue = [];
let flushing = false;
const MAX_QUEUE = parseInt(process.env.KRYOS_SDK_MAX_QUEUE || '500');
const FLUSH_INTERVAL = parseInt(process.env.KRYOS_SDK_FLUSH_INTERVAL || '3000');
let lastFlush = null;

function enqueue(fnDesc, fn) {
  if (queue.length >= MAX_QUEUE) {
    queue.shift(); // drop oldest
  }
  queue.push({ fnDesc, fn, attempts: 0 });
}

async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    for (let i = 0; i < queue.length; ) {
      const item = queue[i];
      try {
        await item.fn();
        queue.splice(i, 1);
      } catch (e) {
        item.attempts += 1;
        if (item.attempts > 5) {
          console.warn('[KryosSDK] Dropping queued item after 5 attempts:', item.fnDesc, e.message);
          queue.splice(i, 1);
        } else {
          i++; // leave it for next round
        }
      }
    }
  } finally {
    flushing = false;
    lastFlush = Date.now();
  }
}

setInterval(() => { if (queue.length && kryos) flushQueue(); }, FLUSH_INTERVAL).unref();

function parseApiKey(raw) {
  if (!raw) return { keyId: null, keySecret: null };
  const parts = raw.split('.')
  if (parts.length < 2) return { keyId: null, keySecret: null };
  return { keyId: parts[0], keySecret: parts.slice(1).join('.') }; // in case secret contains dots (future proof)
}

async function initKryos() {
  if (kryos) return kryos; // already initialized

  const rawKey = process.env.KRYOS_SDK_API_KEY || null;
  const { keyId, keySecret } = parseApiKey(rawKey);

  const baseUrl = process.env.KRYOS_SDK_BASE_URL || process.env.KRYOS_BASE_URL || 'http://localhost:5000/api';
  const serviceName = process.env.KRYOS_SERVICE_NAME || 'dkryos-backend';
  const serviceVersion = process.env.KRYOS_SERVICE_VERSION || '1.0.0';

  if (!keyId || !keySecret) {
    console.warn('[KryosSDK] Missing or invalid KRYOS_SDK_API_KEY; SDK will not send data.');
    return null;
  }

  try {
    const { default: KryosSDK } = await import('kryos-sdk');
    kryos = KryosSDK.init({
      keyId,
      keySecret,
      baseUrl,
      serviceName,
      serviceVersion,
      enableDefaultMetrics: true,
      enableLogging: true,
    });
    await kryos.testConnection().catch(() => {}); // Non-fatal if health check fails
    console.log('[KryosSDK] Initialized for service:', serviceName);
    return kryos;
  } catch (err) {
    console.error('[KryosSDK] Failed to initialize:', err.message);
    return null;
  }
}

function getKryos() {
  return kryos;
}

async function sendEntry(data) {
  if (!kryos) {
    enqueue('entry', () => sendEntry(data));
    return;
  }
  try { await kryos.sendEntryData(data); }
  catch (e) { console.warn('[KryosSDK] sendEntry failed, queued:', e.message); enqueue('entry', () => sendEntry(data)); }
}

async function sendEvent(eventData) {
  if (!kryos) {
    enqueue('event', () => sendEvent(eventData));
    return;
  }
  try { await kryos.api.sendEvent(eventData); }
  catch (e) { console.warn('[KryosSDK] sendEvent failed, queued:', e.message); enqueue('event', () => sendEvent(eventData)); }
}

async function sendError(errorData) {
  if (!kryos) {
    enqueue('error', () => sendError(errorData));
    return;
  }
  try { await kryos.api.sendError(errorData); }
  catch (e) { console.warn('[KryosSDK] sendError failed, queued:', e.message); enqueue('error', () => sendError(errorData)); }
}

async function rotateKryosApiKey(newApiKey) {
  const { keyId, keySecret } = parseApiKey(newApiKey);
  if (!keyId || !keySecret) throw new Error('Invalid API key format');
  const current = kryos?.config;
  kryos = null; // force re-init
  console.log('[KryosSDK] Rotating API key...');
  await initKryosWithOverride({ keyId, keySecret, baseUrl: current?.baseUrl, serviceName: current?.serviceName, serviceVersion: current?.serviceVersion });
}

async function initKryosWithOverride(opts) {
  // internal helper to reinit with provided overrides
  const { default: KryosSDK } = await import('kryos-sdk');
  kryos = KryosSDK.init({
    keyId: opts.keyId,
    keySecret: opts.keySecret,
    baseUrl: opts.baseUrl || 'http://localhost:5000/api',
    serviceName: opts.serviceName || 'dkryos-backend',
    serviceVersion: opts.serviceVersion || '1.0.0',
    enableDefaultMetrics: true,
    enableLogging: true,
  });
  console.log('[KryosSDK] Reinitialized with new API key');
  flushQueue();
  return kryos;
}

function getStatus() {
  const keyId = kryos?.config?.keyId || null;
  return {
    initialized: !!kryos,
    queueLength: queue.length,
    maxQueue: MAX_QUEUE,
    flushing,
    lastFlush,
    flushIntervalMs: FLUSH_INTERVAL,
    serviceName: kryos?.config?.serviceName,
    keyIdMasked: keyId ? ('***' + keyId.slice(-4)) : null,
    sdkVersion: kryos?.constructor?.version,
  };
}

async function flushNow() { await flushQueue(); }

module.exports = { initKryos, getKryos, sendEntry, sendEvent, sendError, rotateKryosApiKey, getStatus, flushNow };
