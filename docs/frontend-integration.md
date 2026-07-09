# Frontend Integration Guide

เอกสารนี้สำหรับต่อหน้าเว็บ Admin / Member เข้ากับ Mock Game Provider API ผ่านลิงก์เดียว

```txt
POST /api/game
```

ตัวอย่าง production URL บน Railway:

```txt
https://YOUR-DOMAIN.up.railway.app/api/game
```

## Base client

```ts
const API_URL = process.env.NEXT_PUBLIC_GAME_API_URL || 'http://localhost:4000/api/game';

export async function gameApi<T = any>(body: Record<string, any>): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data?.message || data?.error?.message || 'Game API request failed');
  }

  return data;
}
```

## Admin Credential UI

หน้าแนะนำ:

```txt
/admin/credentials
```

Actions ที่ใช้:

```txt
provider_configs
provider_config
upsert_provider_config
test_provider_config
```

### Load configs

```ts
await gameApi({ action: 'provider_configs' });
```

### Save config

```ts
await gameApi({
  action: 'upsert_provider_config',
  providerCode: 'PG',
  apiBaseUrl: 'https://provider.example/api',
  merchantId: 'merchant_001',
  agentId: 'agent_001',
  apiKey: 'api_key_here',
  secretKey: 'secret_key_here',
  webhookSecret: 'webhook_secret_here',
  ipWhitelist: ['127.0.0.1'],
  walletMode: 'transfer',
  currency: 'THB',
  language: 'th',
  status: 'active',
  changedBy: 'admin',
});
```

### Test config

```ts
await gameApi({ action: 'test_provider_config', providerCode: 'PG' });
```

## Member Game Lobby

หน้าแนะนำ:

```txt
/member/games
```

Actions ที่ใช้:

```txt
providers
games
create_player
launch
balance
transactions
```

### Load providers

```ts
await gameApi({ action: 'providers', status: 'active' });
```

### Load games

```ts
await gameApi({ action: 'games', providerCode: 'PG', status: 'active' });
```

### Create player before launch

```ts
await gameApi({
  action: 'create_player',
  providerCode: 'PG',
  memberId: 'member_001',
  username: 'member_001',
  currency: 'THB',
  language: 'th',
});
```

### Launch game

```ts
const result = await gameApi({
  action: 'launch',
  providerCode: 'PG',
  memberId: 'member_001',
  gameCode: 'PG-MAHJONG-WAYS',
});

const launchUrl = result?.data?.launchUrl || result?.data?.providerResponse?.launchUrl;
if (launchUrl) window.location.href = launchUrl;
```

### Balance

```ts
await gameApi({ action: 'balance', providerCode: 'PG', memberId: 'member_001' });
```

## Mock Game Play Page

หน้าแนะนำ:

```txt
/mock-game/play
```

Actions ที่ใช้:

```txt
callback_bet
callback_win
callback_settle
callback_cancel
callback_rollback
```

### Bet

```ts
await gameApi({
  action: 'callback_bet',
  providerCode: 'PG',
  memberId: 'member_001',
  gameCode: 'PG-MAHJONG-WAYS',
  roundId: 'ROUND-001',
  amount: 10,
  transactionId: 'BET-001',
});
```

### Win

```ts
await gameApi({
  action: 'callback_win',
  providerCode: 'PG',
  memberId: 'member_001',
  gameCode: 'PG-MAHJONG-WAYS',
  roundId: 'ROUND-001',
  amount: 20,
  transactionId: 'WIN-001',
});
```

### Settle

```ts
await gameApi({
  action: 'callback_settle',
  providerCode: 'PG',
  memberId: 'member_001',
  gameCode: 'PG-MAHJONG-WAYS',
  roundId: 'ROUND-001',
  betAmount: 10,
  winAmount: 20,
  validBetAmount: 10,
});
```

## Admin Reports

หน้าแนะนำ:

```txt
/admin/reports
```

Actions ที่ใช้:

```txt
provider_api_logs
report_rounds
report_summary
reconcile
transactions
```

### Summary

```ts
await gameApi({ action: 'report_summary', providerCode: 'PG', memberId: 'member_001' });
```

### Rounds

```ts
await gameApi({ action: 'report_rounds', providerCode: 'PG', memberId: 'member_001', limit: 50 });
```

### API logs

```ts
await gameApi({ action: 'provider_api_logs', providerCode: 'PG', limit: 50 });
```

### Reconcile

```ts
await gameApi({ action: 'reconcile', providerCode: 'PG', memberId: 'member_001' });
```

## Signature and callback security

ค่าเริ่มต้นควรเปิดง่ายสำหรับ mock:

```env
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
MOCK_CALLBACK_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=false
```

ถ้าจะเปิด security:

```env
MOCK_PROVIDER_REQUIRE_SIGNATURE=true
MOCK_PROVIDER_REQUIRE_NONCE=true
MOCK_CALLBACK_REQUIRE_NONCE=true
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=true
MOCK_CALLBACK_NONCE_TTL_SECONDS=600
```

Headers ที่ต้องส่ง:

```txt
x-api-key
x-timestamp
x-nonce
x-signature
```

Signature base string:

```txt
timestamp + '.' + nonce + '.' + rawBody
```

Signature algorithm:

```txt
HMAC_SHA256(secret, signatureBase)
```

ตัวอย่าง Node.js:

```ts
import { createHmac, randomBytes } from 'crypto';

const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = randomBytes(12).toString('hex');
const rawBody = JSON.stringify(body);
const signature = createHmac('sha256', secret).update(`${timestamp}.${nonce}.${rawBody}`).digest('hex');
```

## Railway variables

API service ต้องมีอย่างน้อย:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=4000
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
MOCK_PROVIDER_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_NONCE=false
MOCK_CALLBACK_REQUIRE_IP_WHITELIST=false
MOCK_PROVIDER_API_KEY=mock_provider_key
MOCK_PROVIDER_SECRET=mock_provider_secret
CREDENTIAL_ENCRYPTION_KEY=change_this_to_a_long_random_value
MOCK_PROVIDER_LAUNCH_BASE_URL=https://YOUR-DOMAIN.up.railway.app/mock-game/play
```

## Built-in static pages

หลัง deploy แล้วเปิดได้ทันที:

```txt
/admin/credentials
/member/games
/mock-game/play
/admin/reports
```
