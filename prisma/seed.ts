import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const providers = [
  { code: 'PG', name: 'PG Soft', logoUrl: '/mock-icons/providers/pg.png', status: 'active', sortOrder: 1 },
  { code: 'JILI', name: 'JILI Games', logoUrl: '/mock-icons/providers/jili.png', status: 'active', sortOrder: 2 },
  { code: 'PP', name: 'Pragmatic Play', logoUrl: '/mock-icons/providers/pp.png', status: 'active', sortOrder: 3 },
  { code: 'EVO', name: 'Evolution', logoUrl: '/mock-icons/providers/evo.png', status: 'active', sortOrder: 4 }
];

const games = [
  { providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', name: 'Mahjong Ways', category: 'slot', iconUrl: '/mock-icons/games/pg-mahjong-ways.png', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'PG', gameCode: 'PG-FORTUNE-TIGER', name: 'Fortune Tiger', category: 'slot', iconUrl: '/mock-icons/games/pg-fortune-tiger.png', status: 'active', isHot: true, sortOrder: 2 },
  { providerCode: 'PG', gameCode: 'PG-WILD-BANDITO', name: 'Wild Bandito', category: 'slot', iconUrl: '/mock-icons/games/pg-wild-bandito.png', status: 'active', isHot: false, sortOrder: 3 },
  { providerCode: 'JILI', gameCode: 'JILI-GOLD-RUSH', name: 'Gold Rush', category: 'slot', iconUrl: '/mock-icons/games/jili-gold-rush.png', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'JILI', gameCode: 'JILI-FISHING-WAR', name: 'Fishing War', category: 'fishing', iconUrl: '/mock-icons/games/jili-fishing-war.png', status: 'active', isHot: true, sortOrder: 2 },
  { providerCode: 'PP', gameCode: 'PP-GATES-OLYMPUS', name: 'Gates of Olympus', category: 'slot', iconUrl: '/mock-icons/games/pp-gates-olympus.png', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'PP', gameCode: 'PP-BONANZA', name: 'Sweet Bonanza', category: 'slot', iconUrl: '/mock-icons/games/pp-bonanza.png', status: 'active', isHot: true, sortOrder: 2 },
  { providerCode: 'EVO', gameCode: 'EVO-BACCARAT', name: 'Live Baccarat', category: 'casino', iconUrl: '/mock-icons/games/evo-baccarat.png', status: 'active', isHot: true, sortOrder: 1 },
  { providerCode: 'EVO', gameCode: 'EVO-ROULETTE', name: 'Live Roulette', category: 'casino', iconUrl: '/mock-icons/games/evo-roulette.png', status: 'active', isHot: false, sortOrder: 2 }
];

async function main() {
  for (const p of providers) await prisma.gameProvider.upsert({ where: { code: p.code }, update: p, create: p });
  for (const g of games) await prisma.game.upsert({ where: { gameCode: g.gameCode }, update: g, create: g });
  console.log('Seed completed', { providers: providers.length, games: games.length });
}
main().finally(async () => prisma.$disconnect());
