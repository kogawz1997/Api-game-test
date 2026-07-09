# API Actions Reference

ทุกอย่างเรียกผ่าน endpoint เดียว:

```txt
POST /api/game
```

Header พื้นฐาน:

```txt
content-type: application/json
```

Response สำเร็จรูปแบบหลัก:

```json
{
  "success": true,
  "data": {}
}
```

## Core

### providers

```json
{ "action": "providers", "status": "active" }
```

### games

```json
{ "action": "games", "providerCode": "PG", "category": "slot", "status": "active", "q": "mahjong" }
```

### game

```json
{ "action": "game", "gameCode": "PG-MAHJONG-WAYS" }
```

### launch

```json
{ "action": "launch", "memberId": "member_001", "providerCode": "PG", "gameCode": "PG-MAHJONG-WAYS" }
```

### balance

```json
{ "action": "balance", "memberId": "member_001", "providerCode": "PG" }
```

### transactions

```json
{ "action": "transactions", "memberId": "member_001", "providerCode": "PG", "limit": 50 }
```

## Wallet transfer

### transfer_in

```json
{
  "action": "transfer_in",
  "memberId": "member_001",
  "providerCode": "PG",
  "amount": 500,
  "referenceId": "TX-IN-001"
}
```

### transfer_out

```json
{
  "action": "transfer_out",
  "memberId": "member_001",
  "providerCode": "PG",
  "amount": 100,
  "referenceId": "TX-OUT-001"
}
```

## Credentials

### provider_configs

```json
{ "action": "provider_configs" }
```

### provider_config

```json
{ "action": "provider_config", "providerCode": "PG" }
```

### upsert_provider_config

```json
{
  "action": "upsert_provider_config",
  "providerCode": "PG",
  "apiBaseUrl": "https://provider.example/api",
  "merchantId": "merchant_001",
  "agentId": "agent_001",
  "apiKey": "api_key_here",
  "secretKey": "secret_key_here",
  "webhookSecret": "webhook_secret_here",
  "ipWhitelist": ["127.0.0.1"],
  "walletMode": "transfer",
  "currency": "THB",
  "language": "th",
  "status": "active",
  "changedBy": "admin"
}
```

### test_provider_config

```json
{ "action": "test_provider_config", "providerCode": "PG" }
```

## Player

### create_player

```json
{
  "action": "create_player",
  "providerCode": "PG",
  "memberId": "member_001",
  "username": "member_001",
  "currency": "THB",
  "language": "th"
}
```

### get_player

```json
{ "action": "get_player", "providerCode": "PG", "memberId": "member_001" }
```

### disable_player

```json
{ "action": "disable_player", "providerCode": "PG", "memberId": "member_001" }
```

## Callback / Round

### callback_bet

```json
{
  "action": "callback_bet",
  "providerCode": "PG",
  "memberId": "member_001",
  "gameCode": "PG-MAHJONG-WAYS",
  "roundId": "ROUND-001",
  "amount": 10,
  "transactionId": "BET-001"
}
```

### callback_win

```json
{
  "action": "callback_win",
  "providerCode": "PG",
  "memberId": "member_001",
  "gameCode": "PG-MAHJONG-WAYS",
  "roundId": "ROUND-001",
  "amount": 20,
  "transactionId": "WIN-001"
}
```

### callback_settle

```json
{
  "action": "callback_settle",
  "providerCode": "PG",
  "memberId": "member_001",
  "gameCode": "PG-MAHJONG-WAYS",
  "roundId": "ROUND-001",
  "betAmount": 10,
  "winAmount": 20,
  "validBetAmount": 10
}
```

### callback_cancel

```json
{ "action": "callback_cancel", "providerCode": "PG", "roundId": "ROUND-001" }
```

### callback_rollback

```json
{ "action": "callback_rollback", "providerCode": "PG", "roundId": "ROUND-001" }
```

### cleanup_callback_nonces

```json
{ "action": "cleanup_callback_nonces" }
```

หรือลบ nonce ที่หมดอายุก่อนวันที่กำหนด:

```json
{ "action": "cleanup_callback_nonces", "before": "2026-07-09T00:00:00.000Z" }
```

## Reports

### provider_api_logs

```json
{ "action": "provider_api_logs", "providerCode": "PG", "limit": 50 }
```

### report_rounds

```json
{ "action": "report_rounds", "providerCode": "PG", "memberId": "member_001", "limit": 50 }
```

### report_summary

```json
{ "action": "report_summary", "providerCode": "PG", "memberId": "member_001" }
```

### reconcile

```json
{ "action": "reconcile", "providerCode": "PG", "memberId": "member_001" }
```

## Error examples

### Missing field

```json
{
  "success": false,
  "code": "MISSING_PROVIDER_CODE",
  "message": "providerCode is required"
}
```

### Duplicate nonce

```json
{
  "success": false,
  "code": "REPLAY_DETECTED",
  "message": "Duplicate callback nonce rejected"
}
```

### Invalid wallet amount

```json
{
  "success": false,
  "code": "INSUFFICIENT_BALANCE",
  "message": "Wallet balance is not enough"
}
```
