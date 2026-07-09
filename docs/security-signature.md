# Security Signature Guide

ระบบนี้รองรับ HMAC signature สำหรับ request หลัก และรองรับ nonce replay protection สำหรับ callback

## Recommended modes

### Development / mock UI

เปิดแบบง่ายก่อน:

```env
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
MOCK_PROVIDER_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=false
```

### Sandbox hardening

```env
MOCK_PROVIDER_REQUIRE_SIGNATURE=true
MOCK_PROVIDER_REQUIRE_NONCE=true
MOCK_CALLBACK_REQUIRE_NONCE=true
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=true
MOCK_CALLBACK_NONCE_TTL_SECONDS=600
```

## Required headers when signature is enabled

```txt
x-api-key
x-timestamp
x-nonce
x-signature
```

## Signature format

Base string:

```txt
timestamp + '.' + nonce + '.' + rawBody
```

Algorithm:

```txt
HMAC_SHA256(secret, baseString)
```

## Node.js example

```ts
import { createHmac, randomBytes } from 'crypto';

const apiKey = 'mock_provider_key';
const secret = 'mock_provider_secret';
const body = { action: 'providers', status: 'active' };
const rawBody = JSON.stringify(body);
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = randomBytes(12).toString('hex');
const signature = createHmac('sha256', secret)
  .update(`${timestamp}.${nonce}.${rawBody}`)
  .digest('hex');

await fetch('https://YOUR-DOMAIN.up.railway.app/api/game', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  },
  body: rawBody,
});
```

## Timestamp window

Request timestamp มีอายุประมาณ 5 นาที

ถ้าเวลาเครื่อง client/server เพี้ยนมาก จะได้ error:

```json
{
  "success": false,
  "code": "INVALID_TIMESTAMP",
  "message": "Invalid or expired timestamp"
}
```

## Nonce replay protection

ถ้าเปิด:

```env
MOCK_CALLBACK_REQUIRE_NONCE=true
```

callback จะต้องส่ง nonce ไม่ซ้ำ

ถ้าใช้ nonce เดิมซ้ำ จะได้:

```json
{
  "success": false,
  "code": "REPLAY_DETECTED",
  "message": "Duplicate callback nonce rejected"
}
```

## Cleanup expired nonce

เรียกผ่าน gateway:

```json
{ "action": "cleanup_callback_nonces" }
```

หรือกำหนดเวลาก่อนลบ:

```json
{ "action": "cleanup_callback_nonces", "before": "2026-07-09T00:00:00.000Z" }
```

## IP whitelist

ถ้าเปิด:

```env
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=true
```

ระบบจะอ่าน whitelist จาก provider config:

```json
{
  "action": "upsert_provider_config",
  "providerCode": "PG",
  "ipWhitelist": ["127.0.0.1", "203.0.113.10"]
}
```

ถ้า IP ไม่ตรง จะได้:

```json
{
  "success": false,
  "code": "IP_NOT_WHITELISTED",
  "message": "Callback IP is not whitelisted"
}
```

## Railway variables

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=4000
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
MOCK_PROVIDER_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=false
MOCK_CALLBACK_NONCE_TTL_SECONDS=600
MOCK_PROVIDER_API_KEY=mock_provider_key
MOCK_PROVIDER_SECRET=mock_provider_secret
CREDENTIAL_ENCRYPTION_KEY=change_this_to_a_long_random_value
MOCK_PROVIDER_LAUNCH_BASE_URL=https://YOUR-DOMAIN.up.railway.app/mock-game/play
```

## Security notes

- ห้ามเก็บ provider secret ใน frontend
- หน้า Admin ควรยิง backend ของเราเท่านั้น
- เมื่อเปิด signature แล้วต้องใช้ raw body เดียวกับที่นำไป sign
- ควร rotate key เป็นรอบ ๆ เมื่อใช้กับ sandbox จริง
- production จริงควรเพิ่ม rate limit และ request id ต่อ
