<div dir="rtl">

# ‏@fincoremk/zatca-qr

مكتبة لقراءة وبناء محتوى رمز QR في الفاتورة الإلكترونية السعودية (هيئة الزكاة والضريبة والجمارك). بلا أي اعتماديات، تدعم العربية، وتعمل في المتصفح وNode.js 18 فأحدث وDeno وBun وCloudflare Workers.

[English](README.md) · [جرّبها على الموقع](https://fincoremk.com/zatca-qr/) · من [FINCOREMK](https://fincoremk.com)

## التثبيت

</div>

```sh
npm install @fincoremk/zatca-qr
```

<div dir="rtl">

## الاستخدام

</div>

```js
import { encode, decode, isVatNumberFormat } from '@fincoremk/zatca-qr';

const qr = encode({ sellerName: 'شركة المثال', vatNumber: '300000000000003', timestamp: new Date(), total: '115.00', vatTotal: '15.00' });
decode(qr); // { phase: 1, sellerName: 'شركة المثال', … }
```

<div dir="rtl">

حقول المرحلة الثانية (البصمة والتوقيع والمفتاح العام وتوقيع الشهادة) تُمرَّر وتُعاد كبايتات `Uint8Array`، وعند وجودها تُرجع `decode()` القيمة `phase: 2`.

## ما لا تفعله المكتبة

- لا توقّع الفواتير ولا تتحقق من التوقيع.
- لا تتحقق من الرقم الضريبي لدى الهيئة؛ الدالة `isVatNumberFormat()` تفحص الصيغة فقط.
- لا ترسم صورة الرمز؛ مرّر النص لأي مولّد QR.

## الترخيص

MIT © 2026 FINCOREMK

</div>
