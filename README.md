# Mock Game Provider API

Sandbox API สำหรับจำลองค่ายเกม ใช้ทดสอบหน้าเว็บ, Wallet, Game Lobby, Provider Balance, Launch Game, Transfer เข้า/ออก, Callback/Result, Transaction Log, Credential settings และรูปไอคอนเกม

> ใช้สำหรับ Development/Sandbox เท่านั้น ไม่เชื่อมต่อ API ค่ายจริง และไม่ควรใช้กับเงินจริง

## จุดสำคัญ: ใช้ลิงก์เดียวต่อเว็บได้เลย

หน้าเว็บสามารถเรียก API ผ่านลิงก์เดียว:

```txt
POST /api/game
```

ดูคู่มือ action ได้ที่:

```txt
GET /api/game
```

ตัวอย่าง base URL บน Railway:

```txt
https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/game
```

## Credential settings ใช้จริงได้ไหม

ใช้เป็นระบบ backend ได้แล้วสำหรับ sandbox/mock integration:

- เก็บ API Base URL
- เก็บ API Key / Secret Key แบบไม่ส่งกลับเป็น plain text
- เก็บ Merchant ID / Agent ID
- เก็บ Webhook Secret
- เก็บ IP Whitelist
- มี audit log ทุกครั้งที่แก้ provider config
- มี action ทดสอบ config ว่าข้อมูลครบไหม

> ถ้าจะต่อค่ายจริง ต้องนำค่า config เหล่านี้ไปใช้ใน provider-specific client ของแต่ละค่าย เพราะแต่ละค่าย format request/signature ไม่เหมือนกัน โลก API ค่ายเกมไม่เคยเมตตาใคร

## Credential actions

### ดู config ทุกค่าย

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"provider_configs"}'
```

### ดู config รายค่าย

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"provider_config","providerCode":"PG"}'
```

### บันทึก credential

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{
    "action":"upsert_provider_config",
    "providerCode":"PG",
    "apiBaseUrl":"https://mock-pg.provider.test/api",
    "merchantId":"merchant_001",
    "agentId":"agent_001",
    "apiKey":"api_key_here",
    "secretKey":"secret_key_here",
    "webhookSecret":"webhook_secret_here",
    "ipWhitelist":["127.0.0.1"],
    "walletMode":"transfer",
    "currency":"THB",
    "language":"th",
    "status":"active",
    "changedBy":"admin"
  }'
```

### ทดสอบว่า config พร้อมต่อไหม

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"test_provider_config","providerCode":"PG"}'
```

## ตัวอย่างเรียกจากเว็บ

```js
const API_URL = 'https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/game';

export async function saveProviderConfig(input) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'upsert_provider_config', ...input })
  });
  return res.json();
}

export async function getProviderConfigs() {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'provider_configs' })
  });
  return res.json();
}
```

## Actions หลัก

```txt
providers
games
game
launch
transfer_in
transfer_out
balance
simulate_bet
simulate_win
simulate_result
transactions
provider_configs
provider_config
upsert_provider_config
test_provider_config
```

## Mock Data ที่มีใน seed

หลังรัน `pnpm prisma db seed` จะได้ข้อมูลตัวอย่าง:

```txt
Providers: 10 ค่าย
Games: 36 เกม
Wallets: 8 รายการ
Transactions: 10 รายการ
Sessions: 3 รายการ
```

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
pnpm start:dev
```

## Railway

หลัง pull commit นี้แล้ว ให้ Railway redeploy จาก GitHub จากนั้น `railway:start` จะรัน `prisma db push` ให้อัตโนมัติ

อย่าลืมตั้ง env นี้ใน Railway:

```env
CREDENTIAL_ENCRYPTION_KEY=ตั้งเป็นค่ายาวสุ่มเองห้ามใช้ค่า default
MOCK_PROVIDER_SECRET=mock_provider_secret
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
```
