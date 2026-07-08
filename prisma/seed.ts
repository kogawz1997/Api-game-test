import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const providers = [
  { code: 'PG', name: 'PG Soft', logoUrl: '/mock-icons/providers/pg.svg', status: 'active', sortOrder: 1 },
  { code: 'JILI', name: 'JILI Games', logoUrl: '/mock-icons/providers/jili.svg', status: 'active', sortOrder: 2 },
  { code: 'PP', name: 'Pragmatic Play', logoUrl: '/mock-icons/providers/pp.svg', status: 'active', sortOrder: 3 },
  { code: 'EVO', name: 'Evolution', logoUrl: '/mock-icons/providers/evo.svg', status: 'active', sortOrder: 4 },
  { code: 'SPADE', name: 'Spadegaming', logoUrl: '/mock-icons/providers/spade.svg', status: 'active', sortOrder: 5 },
  { code: 'FC', name: 'Fa Chai', logoUrl: '/mock-icons/providers/fc.svg', status: 'active', sortOrder: 6 },
  { code: 'CQ9', name: 'CQ9 Gaming', logoUrl: '/mock-icons/providers/cq9.svg', status: 'active', sortOrder: 7 },
  { code: 'KINGMAKER', name: 'Kingmaker', logoUrl: '/mock-icons/providers/kingmaker.svg', status: 'active', sortOrder: 8 },
  { code: 'SABA', name: 'Saba Sports', logoUrl: '/mock-icons/providers/saba.svg', status: 'active', sortOrder: 9 },
  { code: 'BTI', name: 'BTI Sports', logoUrl: '/mock-icons/providers/bti.svg', status: 'maintenance', sortOrder: 10 }
];

const games = [
  // PG
  { providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', name: 'Mahjong Ways', category: 'slot', iconUrl: '/mock-icons/games/pg-mahjong-ways.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS-2', name: 'Mahjong Ways 2', category: 'slot', iconUrl: '/mock-icons/games/pg-mahjong-ways-2.svg', status: 'active', isHot: true, sortOrder: 2 },
  { providerCode: 'PG', gameCode: 'PG-FORTUNE-TIGER', name: 'Fortune Tiger', category: 'slot', iconUrl: '/mock-icons/games/pg-fortune-tiger.svg', status: 'active', isHot: true, sortOrder: 3 },
  { providerCode: 'PG', gameCode: 'PG-FORTUNE-RABBIT', name: 'Fortune Rabbit', category: 'slot', iconUrl: '/mock-icons/games/pg-fortune-rabbit.svg', status: 'active', isHot: true, sortOrder: 4 },
  { providerCode: 'PG', gameCode: 'PG-FORTUNE-OX', name: 'Fortune Ox', category: 'slot', iconUrl: '/mock-icons/games/pg-fortune-ox.svg', status: 'active', isHot: true, sortOrder: 5 },
  { providerCode: 'PG', gameCode: 'PG-WILD-BANDITO', name: 'Wild Bandito', category: 'slot', iconUrl: '/mock-icons/games/pg-wild-bandito.svg', status: 'active', isHot: false, sortOrder: 6 },
  { providerCode: 'PG', gameCode: 'PG-CAISHEN-WINS', name: 'Caishen Wins', category: 'slot', iconUrl: '/mock-icons/games/pg-caishen-wins.svg', status: 'active', isHot: false, sortOrder: 7 },
  { providerCode: 'PG', gameCode: 'PG-DRAGON-HATCH', name: 'Dragon Hatch', category: 'slot', iconUrl: '/mock-icons/games/pg-dragon-hatch.svg', status: 'active', isHot: false, sortOrder: 8 },

  // JILI
  { providerCode: 'JILI', gameCode: 'JILI-GOLD-RUSH', name: 'Gold Rush', category: 'slot', iconUrl: '/mock-icons/games/jili-gold-rush.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'JILI', gameCode: 'JILI-FISHING-WAR', name: 'Fishing War', category: 'fishing', iconUrl: '/mock-icons/games/jili-fishing-war.svg', status: 'active', isHot: true, sortOrder: 2 },
  { providerCode: 'JILI', gameCode: 'JILI-BOXING-KING', name: 'Boxing King', category: 'slot', iconUrl: '/mock-icons/games/jili-boxing-king.svg', status: 'active', isHot: true, sortOrder: 3 },
  { providerCode: 'JILI', gameCode: 'JILI-ALI-BABA', name: 'Ali Baba', category: 'slot', iconUrl: '/mock-icons/games/jili-ali-baba.svg', status: 'active', isHot: false, sortOrder: 4 },
  { providerCode: 'JILI', gameCode: 'JILI-MEGA-FISHING', name: 'Mega Fishing', category: 'fishing', iconUrl: '/mock-icons/games/jili-mega-fishing.svg', status: 'active', isHot: false, sortOrder: 5 },

  // PP
  { providerCode: 'PP', gameCode: 'PP-GATES-OLYMPUS', name: 'Gates of Olympus', category: 'slot', iconUrl: '/mock-icons/games/pp-gates-olympus.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'PP', gameCode: 'PP-BONANZA', name: 'Sweet Bonanza', category: 'slot', iconUrl: '/mock-icons/games/pp-bonanza.svg', status: 'active', isHot: true, sortOrder: 2 },
  { providerCode: 'PP', gameCode: 'PP-STARLIGHT-PRINCESS', name: 'Starlight Princess', category: 'slot', iconUrl: '/mock-icons/games/pp-starlight-princess.svg', status: 'active', isHot: true, sortOrder: 3 },
  { providerCode: 'PP', gameCode: 'PP-WOLF-GOLD', name: 'Wolf Gold', category: 'slot', iconUrl: '/mock-icons/games/pp-wolf-gold.svg', status: 'active', isHot: false, sortOrder: 4 },
  { providerCode: 'PP', gameCode: 'PP-BACCARAT', name: 'Pragmatic Baccarat', category: 'casino', iconUrl: '/mock-icons/games/pp-baccarat.svg', status: 'active', isHot: false, sortOrder: 5 },

  // EVO
  { providerCode: 'EVO', gameCode: 'EVO-BACCARAT', name: 'Live Baccarat', category: 'casino', iconUrl: '/mock-icons/games/evo-baccarat.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'EVO', gameCode: 'EVO-ROULETTE', name: 'Live Roulette', category: 'casino', iconUrl: '/mock-icons/games/evo-roulette.svg', status: 'active', isHot: false, sortOrder: 2 },
  { providerCode: 'EVO', gameCode: 'EVO-DRAGON-TIGER', name: 'Dragon Tiger', category: 'casino', iconUrl: '/mock-icons/games/evo-dragon-tiger.svg', status: 'active', isHot: true, sortOrder: 3 },
  { providerCode: 'EVO', gameCode: 'EVO-SICBO', name: 'Live Sic Bo', category: 'casino', iconUrl: '/mock-icons/games/evo-sicbo.svg', status: 'active', isHot: false, sortOrder: 4 },

  // SPADE
  { providerCode: 'SPADE', gameCode: 'SPADE-BROTHERS-KINGDOM', name: 'Brothers Kingdom', category: 'slot', iconUrl: '/mock-icons/games/spade-brothers-kingdom.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'SPADE', gameCode: 'SPADE-ROYAL-KATT', name: 'Royal Katt', category: 'slot', iconUrl: '/mock-icons/games/spade-royal-katt.svg', status: 'active', isHot: false, sortOrder: 2 },
  { providerCode: 'SPADE', gameCode: 'SPADE-FISHING-GOD', name: 'Fishing God', category: 'fishing', iconUrl: '/mock-icons/games/spade-fishing-god.svg', status: 'active', isHot: true, sortOrder: 3 },

  // FC
  { providerCode: 'FC', gameCode: 'FC-FORTUNE-EGG', name: 'Fortune Egg', category: 'slot', iconUrl: '/mock-icons/games/fc-fortune-egg.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'FC', gameCode: 'FC-NIGHT-MARKET', name: 'Night Market', category: 'slot', iconUrl: '/mock-icons/games/fc-night-market.svg', status: 'active', isHot: false, sortOrder: 2 },
  { providerCode: 'FC', gameCode: 'FC-GOLDEN-GENIE', name: 'Golden Genie', category: 'slot', iconUrl: '/mock-icons/games/fc-golden-genie.svg', status: 'active', isHot: false, sortOrder: 3 },

  // CQ9
  { providerCode: 'CQ9', gameCode: 'CQ9-GOOD-FORTUNE', name: 'Good Fortune', category: 'slot', iconUrl: '/mock-icons/games/cq9-good-fortune.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'CQ9', gameCode: 'CQ9-TREASURE-BOWL', name: 'Treasure Bowl', category: 'slot', iconUrl: '/mock-icons/games/cq9-treasure-bowl.svg', status: 'active', isHot: false, sortOrder: 2 },
  { providerCode: 'CQ9', gameCode: 'CQ9-FISHING', name: 'Paradise Fishing', category: 'fishing', iconUrl: '/mock-icons/games/cq9-fishing.svg', status: 'active', isHot: true, sortOrder: 3 },

  // KINGMAKER
  { providerCode: 'KINGMAKER', gameCode: 'KINGMAKER-POK-DENG', name: 'Pok Deng', category: 'card', iconUrl: '/mock-icons/games/kingmaker-pok-deng.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'KINGMAKER', gameCode: 'KINGMAKER-BACCARAT', name: 'King Baccarat', category: 'card', iconUrl: '/mock-icons/games/kingmaker-baccarat.svg', status: 'active', isHot: false, sortOrder: 2 },
  { providerCode: 'KINGMAKER', gameCode: 'KINGMAKER-HILO', name: 'Hi Lo', category: 'card', iconUrl: '/mock-icons/games/kingmaker-hilo.svg', status: 'active', isHot: true, sortOrder: 3 },

  // SPORTS
  { providerCode: 'SABA', gameCode: 'SABA-SPORTBOOK', name: 'Saba Sportsbook', category: 'sport', iconUrl: '/mock-icons/games/saba-sportsbook.svg', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'BTI', gameCode: 'BTI-SPORTBOOK', name: 'BTI Sportsbook', category: 'sport', iconUrl: '/mock-icons/games/bti-sportsbook.svg', status: 'maintenance', isHot: false, sortOrder: 1 }
];

const wallets = [
  { memberId: 'member_001', providerCode: 'PG', balance: 1250.75 },
  { memberId: 'member_001', providerCode: 'JILI', balance: 480.25 },
  { memberId: 'member_001', providerCode: 'PP', balance: 2200 },
  { memberId: 'member_001', providerCode: 'EVO', balance: 0 },
  { memberId: 'member_002', providerCode: 'PG', balance: 300 },
  { memberId: 'member_002', providerCode: 'SABA', balance: 1500 },
  { memberId: 'demo_vip', providerCode: 'PG', balance: 9999 },
  { memberId: 'demo_vip', providerCode: 'EVO', balance: 5000 }
];

const transactions = [
  { memberId: 'member_001', providerCode: 'PG', gameCode: null, type: 'transfer_in', amount: 1000, beforeBalance: 0, afterBalance: 1000, referenceId: 'SEED-TX-PG-IN-001', providerTransactionId: 'PG-SEED-IN-001', status: 'success' },
  { memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', type: 'bet', amount: 50, beforeBalance: 1000, afterBalance: 950, referenceId: 'SEED-BET-PG-001', providerTransactionId: 'PG-SEED-BET-001', status: 'success' },
  { memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', type: 'win', amount: 300.75, beforeBalance: 950, afterBalance: 1250.75, referenceId: 'SEED-WIN-PG-001', providerTransactionId: 'PG-SEED-WIN-001', status: 'success' },
  { memberId: 'member_001', providerCode: 'JILI', gameCode: null, type: 'transfer_in', amount: 500, beforeBalance: 0, afterBalance: 500, referenceId: 'SEED-TX-JILI-IN-001', providerTransactionId: 'JILI-SEED-IN-001', status: 'success' },
  { memberId: 'member_001', providerCode: 'JILI', gameCode: 'JILI-FISHING-WAR', type: 'bet', amount: 19.75, beforeBalance: 500, afterBalance: 480.25, referenceId: 'SEED-BET-JILI-001', providerTransactionId: 'JILI-SEED-BET-001', status: 'success' },
  { memberId: 'member_001', providerCode: 'PP', gameCode: null, type: 'transfer_in', amount: 2500, beforeBalance: 0, afterBalance: 2500, referenceId: 'SEED-TX-PP-IN-001', providerTransactionId: 'PP-SEED-IN-001', status: 'success' },
  { memberId: 'member_001', providerCode: 'PP', gameCode: null, type: 'transfer_out', amount: 300, beforeBalance: 2500, afterBalance: 2200, referenceId: 'SEED-TX-PP-OUT-001', providerTransactionId: 'PP-SEED-OUT-001', status: 'success' },
  { memberId: 'member_002', providerCode: 'SABA', gameCode: null, type: 'transfer_in', amount: 1500, beforeBalance: 0, afterBalance: 1500, referenceId: 'SEED-TX-SABA-IN-001', providerTransactionId: 'SABA-SEED-IN-001', status: 'success' },
  { memberId: 'demo_vip', providerCode: 'PG', gameCode: null, type: 'transfer_in', amount: 9999, beforeBalance: 0, afterBalance: 9999, referenceId: 'SEED-TX-VIP-PG-IN-001', providerTransactionId: 'PG-SEED-VIP-IN-001', status: 'success' },
  { memberId: 'demo_vip', providerCode: 'EVO', gameCode: null, type: 'transfer_in', amount: 5000, beforeBalance: 0, afterBalance: 5000, referenceId: 'SEED-TX-VIP-EVO-IN-001', providerTransactionId: 'EVO-SEED-VIP-IN-001', status: 'success' }
];

const sessions = [
  { memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', sessionToken: 'seed_session_member_001_pg', status: 'active' },
  { memberId: 'member_001', providerCode: 'JILI', gameCode: 'JILI-FISHING-WAR', sessionToken: 'seed_session_member_001_jili', status: 'active' },
  { memberId: 'demo_vip', providerCode: 'EVO', gameCode: 'EVO-BACCARAT', sessionToken: 'seed_session_demo_vip_evo', status: 'active' }
];

async function main() {
  for (const p of providers) {
    await prisma.gameProvider.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
  }

  for (const g of games) {
    await prisma.game.upsert({
      where: { gameCode: g.gameCode },
      update: g,
      create: g
    });
  }

  for (const w of wallets) {
    await prisma.providerWallet.upsert({
      where: { memberId_providerCode: { memberId: w.memberId, providerCode: w.providerCode } },
      update: { balance: w.balance },
      create: w
    });
  }

  for (const t of transactions) {
    const payload = {
      memberId: t.memberId,
      providerCode: t.providerCode,
      gameCode: t.gameCode,
      type: t.type,
      amount: t.amount,
      beforeBalance: t.beforeBalance,
      afterBalance: t.afterBalance,
      referenceId: t.referenceId,
      providerTransactionId: t.providerTransactionId,
      status: t.status,
      rawRequest: JSON.stringify({ seed: true, referenceId: t.referenceId }),
      rawResponse: JSON.stringify({ seed: true, status: t.status, afterBalance: t.afterBalance })
    };

    await prisma.providerTransaction.upsert({
      where: { referenceId: t.referenceId },
      update: payload,
      create: payload
    });
  }

  const launchBaseUrl = process.env.MOCK_PROVIDER_LAUNCH_BASE_URL || 'http://localhost:4000/mock-game/play';
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  for (const s of sessions) {
    const launchUrl = `${launchBaseUrl}?token=${encodeURIComponent(s.sessionToken)}&providerCode=${encodeURIComponent(s.providerCode)}&gameCode=${encodeURIComponent(s.gameCode)}&memberId=${encodeURIComponent(s.memberId)}`;

    await prisma.providerSession.upsert({
      where: { sessionToken: s.sessionToken },
      update: { ...s, launchUrl, expiresAt },
      create: { ...s, launchUrl, expiresAt }
    });
  }

  console.log('Seed completed', {
    providers: providers.length,
    games: games.length,
    wallets: wallets.length,
    transactions: transactions.length,
    sessions: sessions.length
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
