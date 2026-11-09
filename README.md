# @fincoremk/zatca-qr

Read and build the QR code payload of Saudi (ZATCA) e-invoices. Zero dependencies, Arabic-ready, and it runs anywhere JavaScript runs: browsers, Node.js 18+, Deno, Bun and Cloudflare Workers.

[العربية](README.ar.md) · [Try it online](https://fincoremk.com/zatca-qr/) · by [FINCOREMK](https://fincoremk.com)

## Install

```sh
npm install @fincoremk/zatca-qr
```

## Use

```js
import { encode, decode, isVatNumberFormat } from '@fincoremk/zatca-qr';

const qr = encode({
  sellerName: 'شركة المثال',
  vatNumber: '300000000000003',
  timestamp: new Date(),
  total: '115.00',
  vatTotal: '15.00',
});

decode(qr);
// { phase: 1, sellerName: 'شركة المثال', vatNumber: '300000000000003', timestamp: '…', total: '115.00', vatTotal: '15.00' }

isVatNumberFormat('300000000000003'); // true
```

Phase 2 fields (`invoiceHash`, `signature`, `publicKey`, `certificateSignature`) are accepted as `Uint8Array` and returned as `Uint8Array`. When tags 6–8 are present, `decode()` reports `phase: 2`.

## What it does not do

- It does not sign invoices or verify signatures.
- It does not check a VAT number with ZATCA; `isVatNumberFormat()` checks the shape only.
- It does not draw the QR image. Pass the string to any QR generator.

## API

| Function | Returns |
| --- | --- |
| `encode(fields)` | Base64 payload string |
| `decode(base64)` | Object keyed by field name, plus `phase` |
| `parse(base64)` | `{ fields: [{tag, name, value}], phase }` |
| `isVatNumberFormat(vat)` | `boolean` |
| `QRError` | Error class for malformed input |

## Test

```sh
npm test
```

## License

MIT © 2026 FINCOREMK
