# Mock Game Provider API

Sandbox API สำหรับจำลองค่ายเกม ใช้ทดสอบหน้าเว็บ, Wallet, Game Lobby, Provider Balance, Launch Game, Transfer เข้า/ออก, Callback/Result, Transaction Log และรูปไอคอนเกม

> ใช้สำหรับ Development/Sandbox เท่านั้น ไม่เชื่อมต่อ API ค่ายจริง และไม่ควรใช้กับเงินจริง

## จุดสำคัญ: ใช้ลิงก์เดียวต่อเว็บได้เลย

หน้าเว็บสามารถเรียก API ผ่านลิงก์เดียว:

```txt
POST /api/game
```

ส่ง `action` เพื่อเลือกว่าจะทำอะไร เช่น ดึงค่าย, ดึงเกม, เปิดเกม, โยกเงิน, เช็กยอด, ดู transaction

ดูคู่มือ action ได้ที่:

```txt
GET /api/game
```

ตัวอย่าง base URL บน Railway:

```txt
https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/game
```

## ตัวอย่างเรียกจากเว็บ

### ดึงค่ายเกม

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'providers', status: 'active' })
}).then(r => r.json());
```

### ดึงเกมทั้งหมดของ PG

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'games', providerCode: 'PG', status: 'active' })
}).then(r => r.json());
```

### ดึงเกมตามหมวด

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'games', category: 'casino', status: 'active' })
}).then(r => r.json());
```

### เปิดเกม

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    action: 'launch',
    memberId: 'member_001',
    providerCode: 'PG',
    gameCode: 'PG-MAHJONG-WAYS'
  })
}).then(r => r.json());
```

### โยกเงินเข้า provider

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    action: 'transfer_in',
    memberId: 'member_001',
    providerCode: 'PG',
    amount: 500,
    referenceId: `TX-IN-${Date.now()}`
  })
}).then(r => r.json());
```

### โยกเงินออก provider

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    action: 'transfer_out',
    memberId: 'member_001',
    providerCode: 'PG',
    amount: 100,
    referenceId: `TX-OUT-${Date.now()}`
  })
}).then(r => r.json());
```

### เช็กยอดใน provider

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'balance', memberId: 'member_001', providerCode: 'PG' })
}).then(r => r.json());
```

### ดู transaction

```js
await fetch(`${API_URL}/api/game`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'transactions', memberId: 'member_001', limit: 20 })
}).then(r => r.json());
```

## Stack

- NestJS
- Prisma
- PostgreSQL สำหรับ Railway
- HMAC Signature แบบเปิด/ปิดได้
- Seed mock data แบบมีข้อมูลพร้อมใช้

## Mock Data ที่มีใน seed

หลังรัน `pnpm prisma db seed` จะได้ข้อมูลตัวอย่าง:

```txt
Providers: 10 ค่าย
Games: 36 เกม
Wallets: 8 รายการ
Transactions: 10 รายการ
Sessions: 3 รายการ
```

ค่ายเกมตัวอย่าง:

```txt
PG, JILI, PP, EVO, SPADE, FC, CQ9, KINGMAKER, SABA, BTI
```

หมวดเกมตัวอย่าง:

```txt
slot, casino, fishing, card, sport
```

Member สำหรับทดสอบ:

```txt
member_001
member_002
demo_vip
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

API:

```txt
http://localhost:4000
```

Health:

```bash
curl http://localhost:4000/health
```

## Endpoints เดิมยังใช้ได้

```txt
GET    /mock-provider/providers
GET    /mock-provider/games?providerCode=PG&category=slot&q=mahjong
GET    /mock-provider/games/:gameCode
POST   /mock-provider/launch
POST   /mock-provider/transfer-in
POST   /mock-provider/transfer-out
GET    /mock-provider/balance?memberId=member_001&providerCode=PG
POST   /mock-provider/simulate-bet
POST   /mock-provider/simulate-win
POST   /mock-provider/simulate-result
GET    /mock-provider/transactions?memberId=member_001&providerCode=PG&limit=50
```

## ทดสอบลิงก์เดียว

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"providers","status":"active"}'
```

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"games","providerCode":"PG","status":"active"}'
```

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"balance","memberId":"member_001","providerCode":"PG"}'
```

## HMAC Signature

เริ่มต้นปิดไว้เพื่อให้เทสง่าย:

```env
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
```

ถ้าจะเปิด:

```env
MOCK_PROVIDER_REQUIRE_SIGNATURE=true
MOCK_PROVIDER_API_KEY=mock_provider_key
MOCK_PROVIDER_SECRET=mock_provider_secret
```

Header:

```txt
x-api-key: mock_provider_key
x-timestamp: unix_timestamp_seconds
x-signature: HMAC_SHA256(secret, timestamp + "." + rawBody)
```
