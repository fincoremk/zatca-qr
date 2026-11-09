import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, parse, isVatNumberFormat, QRError } from '../src/index.js';

const base = { sellerName: 'شركة الاختبار', vatNumber: '300000000000003', timestamp: '2026-11-08T12:00:00Z', total: '115.00', vatTotal: '15.00' };

test('round-trip Phase 1 with Arabic seller name', () => {
  const d = decode(encode(base));
  assert.equal(d.phase, 1); assert.equal(d.sellerName, 'شركة الاختبار'); assert.equal(d.vatNumber, '300000000000003'); assert.equal(d.total, '115.00');
});

test('Phase 2 fields are kept as bytes', () => {
  const h = new Uint8Array(32).fill(7), s = new Uint8Array(70).fill(2), k = new Uint8Array(88).fill(3);
  const d = decode(encode({ ...base, invoiceHash: h, signature: s, publicKey: k }));
  assert.equal(d.phase, 2); assert.deepEqual(d.invoiceHash, h); assert.equal(d.publicKey.length, 88);
});

test('Date timestamps are written without milliseconds', () => {
  assert.equal(decode(encode({ ...base, timestamp: new Date('2026-11-08T12:00:00.123Z') })).timestamp, '2026-11-08T12:00:00Z');
});

test('known vector from a hand-built payload', () => {
  const tlv = (t, s) => { const b = Buffer.from(s, 'utf8'); return Buffer.concat([Buffer.from([t, b.length]), b]); };
  const b64 = Buffer.concat([tlv(1, 'Bobs Records'), tlv(2, '310122393500003'), tlv(3, '2022-04-25T15:30:00Z'), tlv(4, '1000.00'), tlv(5, '150.00')]).toString('base64');
  assert.equal(encode({ sellerName: 'Bobs Records', vatNumber: '310122393500003', timestamp: '2022-04-25T15:30:00Z', total: '1000.00', vatTotal: '150.00' }), b64);
});

test('malformed input is rejected with QRError', () => {
  assert.throws(() => parse('not base64!!'), QRError);
  assert.throws(() => parse(Buffer.from([1, 10, 65]).toString('base64')), QRError);
  assert.throws(() => parse(Buffer.from([12, 1, 65]).toString('base64')), QRError);
  assert.throws(() => parse(Buffer.from([1, 1, 65]).toString('base64')), /Missing/);
  assert.throws(() => encode({ ...base, sellerName: '' }), /required/);
  assert.throws(() => encode({ ...base, sellerName: 'x'.repeat(300) }), /255/);
});

test('VAT number format check', () => {
  assert.equal(isVatNumberFormat('300000000000003'), true);
  assert.equal(isVatNumberFormat('123'), false);
  assert.equal(isVatNumberFormat('300000000000004'), false);
});

test('URL-safe Base64 and whitespace are accepted', () => {
  const b = encode(base).replace(/\+/g, '-').replace(/\//g, '_');
  assert.equal(decode(' ' + b + '\n').sellerName, 'شركة الاختبار');
});
