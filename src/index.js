/**
 * @fincoremk/zatca-qr — Read and build the QR code payload of Saudi (ZATCA) e-invoices.
 * Zero dependencies. Works in browsers, Node.js 18+, Deno, Bun and Cloudflare Workers.
 * The QR payload is a Base64 string of TLV (tag-length-value) fields.
 * Tags 1–5 are text (Phase 1). Tags 6–9 are binary (Phase 2: hash, signature, public key, certificate signature).
 * This library reads and builds the payload only. It does not sign invoices or verify signatures.
 * MIT License — Copyright (c) 2026 FINCOREMK
 */

/** Field names by tag. */
export const TAGS = Object.freeze({
  1: 'sellerName',
  2: 'vatNumber',
  3: 'timestamp',
  4: 'total',
  5: 'vatTotal',
  6: 'invoiceHash',
  7: 'signature',
  8: 'publicKey',
  9: 'certificateSignature',
});

const TEXT_TAGS = new Set([1, 2, 3, 4, 5]);
const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(str) {
  const clean = String(str).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) throw new QRError('Not valid Base64');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Error thrown for malformed input. */
export class QRError extends Error {
  constructor(message) { super(message); this.name = 'QRError'; }
}

/**
 * Parse a QR payload into its TLV fields.
 * @param {string} base64 The QR code text.
 * @returns {{ fields: Array<{tag:number,name:string,value:string|Uint8Array}>, phase: 1|2 }}
 */
export function parse(base64) {
  const bytes = fromBase64(base64);
  const fields = [];
  let p = 0;
  while (p < bytes.length) {
    if (p + 2 > bytes.length) throw new QRError('Truncated field header at byte ' + p);
    const tag = bytes[p], len = bytes[p + 1];
    if (tag < 1 || tag > 9) throw new QRError('Unknown tag ' + tag + ' at byte ' + p);
    if (p + 2 + len > bytes.length) throw new QRError('Field ' + tag + ' is longer than the payload');
    const raw = bytes.slice(p + 2, p + 2 + len);
    let value = raw;
    if (TEXT_TAGS.has(tag)) {
      try { value = dec.decode(raw); } catch { throw new QRError('Field ' + tag + ' is not valid UTF-8'); }
    }
    fields.push({ tag, name: TAGS[tag], value });
    p += 2 + len;
  }
  const has = t => fields.some(f => f.tag === t);
  if (!has(1) || !has(2)) throw new QRError('Missing seller name (1) or VAT number (2)');
  return { fields, phase: has(6) && has(7) && has(8) ? 2 : 1 };
}

/**
 * Convenience: parse and return a plain object keyed by field name.
 * @param {string} base64
 */
export function decode(base64) {
  const { fields, phase } = parse(base64);
  const out = { phase };
  for (const f of fields) out[f.name] = f.value;
  return out;
}

/**
 * Build a QR payload.
 * @param {{sellerName:string, vatNumber:string, timestamp:string|Date, total:string|number, vatTotal:string|number,
 *          invoiceHash?:Uint8Array|string, signature?:Uint8Array|string, publicKey?:Uint8Array, certificateSignature?:Uint8Array}} f
 *        Binary fields may be Uint8Array or (for hash/signature) the Base64 text ZATCA tools produce.
 * @returns {string} Base64 payload to put in the QR code.
 */
export function encode(f) {
  if (!f || typeof f !== 'object') throw new QRError('Fields object required');
  const ts = f.timestamp instanceof Date ? f.timestamp.toISOString().replace(/\.\d{3}Z$/, 'Z') : f.timestamp;
  const vals = [f.sellerName, f.vatNumber, ts, f.total, f.vatTotal, f.invoiceHash, f.signature, f.publicKey, f.certificateSignature];
  const parts = [];
  vals.forEach((v, i) => {
    const tag = i + 1;
    if (v == null || v === '') { if (tag <= 5) throw new QRError('Field ' + TAGS[tag] + ' is required'); return; }
    const bytes = v instanceof Uint8Array ? v : enc.encode(String(v));
    if (bytes.length > 255) throw new QRError('Field ' + TAGS[tag] + ' is longer than 255 bytes');
    parts.push(Uint8Array.of(tag, bytes.length), bytes);
  });
  const total = parts.reduce((n, b) => n + b.length, 0), out = new Uint8Array(total);
  let o = 0; for (const b of parts) { out.set(b, o); o += b.length; }
  return toBase64(out);
}

/**
 * Check the shape of a Saudi VAT registration number: 15 digits, starting and ending with 3.
 * This checks the format only, not whether the number is registered.
 * @param {string} vat
 */
export function isVatNumberFormat(vat) {
  return /^3\d{13}3$/.test(String(vat));
}
