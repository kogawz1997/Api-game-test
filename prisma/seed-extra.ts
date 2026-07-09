import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const players = [
  { providerCode: 'PG', memberId: 'member_001', username: 'member001', displayName: 'Member 001', currency: 'THB', language: 'th', status: 'active' },
  { providerCode: 'JILI', memberId: 'member_001', username: 'member001_jili', displayName: 'Member 001', currency: 'THB', language: 'th', status: 'active' },
  { providerCode: 'PP', memberId: 'member_001', username: 'member001_pp', displayName: 'Member 001', currency: 'THB', language: 'th', status: 'active' },
  { providerCode: 'PG', memberId: 'demo_vip', username: 'demo_vip_pg', displayName: 'Demo VIP', currency: 'THB', language: 'th', status: 'active' },
];

const rounds = [
  { providerCode: 'PG', memberId: 'member_001', gameCode: 'PG-MAHJONG-WAYS', roundId: 'SEED-ROUND-PG-001', betAmount: 50, winAmount: 300.75, validBetAmount: 50, status: 'settled' },
  { providerCode: 'JILI', memberId: 'member_001', gameCode: 'JILI-FISHING-WAR', roundId: 'SEED-ROUND-JILI-001', betAmount: 19.75, winAmount: 0, validBetAmount: 19.75, status: 'settled' },
  { providerCode: 'PG', memberId: 'demo_vip', gameCode: 'PG-FORTUNE-TIGER', roundId: 'SEED-ROUND-VIP-001', betAmount: 100, winAmount: 500, validBetAmount: 100, status: 'settled' },
];

const logs = [
  { providerCode: 'PG', action: 'seed_provider_config', direction: 'internal', status: 'success', durationMs: 12, requestMasked: { seed: true, providerCode: 'PG' }, responseMasked: { seeded: true } },
  { providerCode: 'PG', action: 'callback_bet', direction: 'inbound', status: 'success', durationMs: 21, requestMasked: { seed: true, roundId: 'SEED-ROUND-PG-001', amount: 50 }, responseMasked: { seeded: true } },
  { providerCode: 'PG', action: 'callback_win', direction: 'inbound', status: 'success', durationMs: 18, requestMasked: { seed: true, roundId: 'SEED-ROUND-PG-001', amount: 300.75 }, responseMasked: { seeded: true } },
  { providerCode: 'JILI', action: 'callback_bet', direction: 'inbound', status: 'success', durationMs: 19, requestMasked: { seed: true, roundId: 'SEED-ROUND-JILI-001', amount: 19.75 }, responseMasked: { seeded: true } },
];

async function main() {
  for (const player of players) {
    await prisma.providerPlayer.upsert({
      where: { providerCode_memberId: { providerCode: player.providerCode, memberId: player.memberId } },
      update: { ...player, rawData: JSON.stringify({ seed: true }) },
      create: { ...player, rawData: JSON.stringify({ seed: true }) },
    });
  }

  for (const round of rounds) {
    await prisma.gameRound.upsert({
      where: { providerCode_roundId: { providerCode: round.providerCode, roundId: round.roundId } },
      update: { ...round, rawData: JSON.stringify({ seed: true }), settledAt: round.status === 'settled' ? new Date() : null },
      create: { ...round, rawData: JSON.stringify({ seed: true }), settledAt: round.status === 'settled' ? new Date() : null },
    });
  }

  await prisma.providerApiLog.deleteMany({ where: { requestMasked: { contains: '"seed":true' } } });

  for (const log of logs) {
    await prisma.providerApiLog.create({
      data: {
        providerCode: log.providerCode,
        action: log.action,
        direction: log.direction,
        status: log.status,
        durationMs: log.durationMs,
        requestMasked: JSON.stringify(log.requestMasked),
        responseMasked: JSON.stringify(log.responseMasked),
      },
    });
  }

  await prisma.callbackNonce.deleteMany({ where: { nonce: { startsWith: 'seed-' } } });
  await prisma.callbackNonce.createMany({
    data: [
      { providerCode: 'PG', nonce: 'seed-used-nonce-pg', action: 'callback_bet', expiresAt: new Date(Date.now() + 1000 * 60 * 10) },
      { providerCode: 'JILI', nonce: 'seed-used-nonce-jili', action: 'callback_bet', expiresAt: new Date(Date.now() + 1000 * 60 * 10) },
    ],
  });

  console.log('Extra seed completed', { players: players.length, rounds: rounds.length, logs: logs.length });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
