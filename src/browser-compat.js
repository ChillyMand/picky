export function clearProgress(storage, key) { try { storage?.removeItem(key); } catch {} }

export async function copyText(text, clipboard = globalThis.navigator?.clipboard, documentApi = globalThis.document) {
  try { if (clipboard?.writeText) { await clipboard.writeText(text); return true; } } catch {}
  try {
    const textarea = documentApi.createElement('textarea'); textarea.value = text; textarea.setAttribute('readonly', ''); textarea.style.position = 'fixed'; textarea.style.opacity = '0';
    documentApi.body.append(textarea); textarea.select(); const copied = documentApi.execCommand('copy'); textarea.remove(); return copied;
  } catch { return false; }
}
