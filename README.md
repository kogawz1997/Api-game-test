# Mock Game Provider API

Sandbox API สำหรับจำลองค่ายเกม ใช้ทดสอบหน้าเว็บ, Wallet, Game Lobby, Provider Balance, Launch Game, Transfer เข้า/ออก, Callback/Result, Transaction Log และรูปไอคอนเกม

> ใช้สำหรับ Development/Sandbox เท่านั้น ไม่เชื่อมต่อ API ค่ายจริง และไม่ควรใช้กับเงินจริง

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

## Endpoints

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

## ทดสอบข้อมูล mock

```bash
curl http://localhost:4000/mock-provider/providers
curl "http://localhost:4000/mock-provider/games?providerCode=PG"
curl "http://localhost:4000/mock-provider/games?category=casino"
curl "http://localhost:4000/mock-provider/balance?memberId=member_001&providerCode=PG"
curl "http://localhost:4000/mock-provider/transactions?memberId=member_001&limit=20"
```

Transfer in:

```bash
curl -X POST http://localhost:4000/mock-provider/transfer-in \
  -H "Content-Type: application/json" \
  -d '{"memberId":"member_001","providerCode":"PG","amount":500,"referenceId":"TX-IN-000001"}'
```

Launch:

```bash
curl -X POST http://localhost:4000/mock-provider/launch \
  -H "Content-Type: application/json" \
  -d '{"memberId":"member_001","providerCode":"PG","gameCode":"PG-MAHJONG-WAYS"}'
```

Simulate bet:

```bash
curl -X POST http://localhost:4000/mock-provider/simulate-bet \
  -H "Content-Type: application/json" \
  -d '{"memberId":"member_001","providerCode":"PG","gameCode":"PG-MAHJONG-WAYS","amount":50,"referenceId":"BET-000001"}'
```

Simulate win:

```bash
curl -X POST http://localhost:4000/mock-provider/simulate-win \
  -H "Content-Type: application/json" \
  -d '{"memberId":"member_001","providerCode":"PG","gameCode":"PG-MAHJONG-WAYS","amount":120,"referenceId":"WIN-000001"}'
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
