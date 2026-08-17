const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function createPublicCode(random = Math.random) {
  let code = '';
  for (let index = 0; index < 5; index += 1) code += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  return code;
}

export function normalizePublicCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, '').slice(0, 5);
}

export function isPublicCode(value) { return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/.test(normalizePublicCode(value)); }
