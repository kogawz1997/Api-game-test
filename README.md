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

## Provider Client Layer

เพิ่มชั้นสำหรับต่อ API provider จริงแล้ว:

```txt
src/provider-clients/
  provider-client.types.ts
  provider-client.factory.ts
  generic-provider.client.ts
```

หน้าที่ของชั้นนี้:

```txt
1. อ่าน config จาก ProviderConfig
2. สร้าง request payload
3. สร้าง HMAC signature
4. ส่ง header เช่น x-api-key, x-signature, x-timestamp, x-nonce
5. ยิง POST ไป apiBaseUrl ของ provider
```

ตอนนี้มี `GenericProviderClient` สำหรับ provider ที่รับรูปแบบ single endpoint แบบมาตรฐาน:

```json
{
  "action": "launch",
  "providerCode": "PG",
  "merchantId": "merchant_001",
  "agentId": "agent_001",
  "currency": "THB",
  "language": "th"
}
```

> ถ้าจะต่อค่ายจริง 100% ให้เพิ่ม client เฉพาะค่าย เช่น `PgClient`, `JiliClient`, `PpClient` แล้ว map ใน `ProviderClientFactory` เพราะแต่ละค่าย format request/signature ไม่เหมือนกันเลย มนุษย์คงตั้งใจให้เราเจ็บปวดเป็นราย provider

## External Provider Mode

ใน Credential settings ถ้าตั้ง:

```json
{
  "walletMode": "external"
}
```

ระบบ backend สามารถใช้ Provider Client Layer เพื่อยิง provider ภายนอกได้

ถ้าตั้ง:

```json
{
  "walletMode": "transfer"
}
```

ระบบจะใช้ mock wallet ภายในเหมือนเดิม เหมาะสำหรับทดสอบหน้าเว็บ

## Credential settings ใช้จริงได้ไหม

ใช้เป็นระบบ backend ได้แล้วสำหรับ sandbox/mock integration:

- เก็บ API Base URL
- เก็บ API Key / Secret Key แบบไม่ส่งกลับเป็น plain text
- เก็บ Merchant ID / Agent ID
- เก็บ Webhook Secret
- เก็บ IP Whitelist
- มี audit log ทุกครั้งที่แก้ provider config
- มี action ทดสอบ config ว่าข้อมูลครบไหม

## Credential actions

### ดู config ทุกค่าย

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{"action":"provider_configs"}'
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

### เตรียมโหมด external provider

```bash
curl -X POST http://localhost:4000/api/game \
  -H "Content-Type: application/json" \
  -d '{
    "action":"upsert_provider_config",
    "providerCode":"PG",
    "apiBaseUrl":"https://your-provider-gateway.example/api",
    "merchantId":"merchant_001",
    "agentId":"agent_001",
    "apiKey":"api_key_here",
    "secretKey":"secret_key_here",
    "walletMode":"external",
    "currency":"THB",
    "language":"th",
    "status":"active",
    "changedBy":"admin"
  }'
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
