# Deploy on Railway

## 1) สร้าง Project

1. เข้า Railway
2. New Project
3. Deploy from GitHub repo
4. เลือก `kogawz1997/Api-game-test`

## 2) เพิ่ม PostgreSQL

ใน Railway Project:

```txt
New → Database → Add PostgreSQL
```

Railway จะสร้าง `DATABASE_URL` ให้ service ใช้เอง

## 3) ตั้ง Variables

ใน service ของ API ให้มี:

```env
PORT=4000
MOCK_PROVIDER_REQUIRE_SIGNATURE=false
MOCK_PROVIDER_API_KEY=mock_provider_key
MOCK_PROVIDER_SECRET=mock_provider_secret
MOCK_PROVIDER_LAUNCH_BASE_URL=https://YOUR-RAILWAY-DOMAIN/mock-game/play
```

`DATABASE_URL` ควรได้จาก PostgreSQL plugin ของ Railway อัตโนมัติ

## 4) Deploy

Railway จะใช้:

```txt
Build: pnpm build
Start: pnpm railway:start
```

ตอน start จะรัน:

```bash
prisma db push
prisma db seed
node dist/main.js
```

Seed เป็น upsert จึงรันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ

## 5) ทดสอบหลัง deploy

```bash
curl https://YOUR-RAILWAY-DOMAIN/health
curl https://YOUR-RAILWAY-DOMAIN/mock-provider/providers
curl "https://YOUR-RAILWAY-DOMAIN/mock-provider/games?providerCode=PG"
```

## หมายเหตุ

- โปรเจกต์นี้ใช้ PostgreSQL บน Railway แล้ว ไม่ใช้ SQLite
- ห้ามตั้ง `DATABASE_URL` เป็น `file:./dev.db` บน Railway เพราะไฟล์ใน container ไม่เหมาะกับ production/deploy
- ถ้าเปิด signature ให้ตั้ง `MOCK_PROVIDER_REQUIRE_SIGNATURE=true` แล้ว frontend/backend ที่เรียก POST ต้องส่ง HMAC headers
