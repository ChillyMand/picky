export function createVisitorId(storage, cryptoApi = globalThis.crypto, now = Date.now, random = Math.random) {
  try { const existing = storage?.getItem('picky-visitor-id'); if (existing) return existing; } catch {}
  const id = typeof cryptoApi?.randomUUID === 'function' ? cryptoApi.randomUUID() : `visitor-${now().toString(36)}-${Math.floor(random() * 0x100000000).toString(36)}`;
  try { storage?.setItem('picky-visitor-id', id); } catch {}
  return id;
}

export function clearProgress(storage, key) { try { storage?.removeItem(key); } catch {} }
