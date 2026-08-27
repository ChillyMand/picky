const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function secureRandom() {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0] / 0x100000000;
}

export function createPublicCode(random = secureRandom) {
  let code = '';
  for (let index = 0; index < 4; index += 1) code += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  return code;
}

export function normalizePublicCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, '').slice(0, 4);
}

export function isPublicCode(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, '');
  return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(raw);
}
