// @ts-check
export const FNV_OFFSET = 0x811c9dc5;
/** FNV-1a 32-bit over bytes. Used for golden-state tests and desync detection. @param {number} h @param {Uint8Array} bytes */
export function fnv1a(h, bytes) {
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
