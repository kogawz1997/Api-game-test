import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProviderTransaction } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BalanceQueryDto, GameQueryDto, LaunchGameDto, MoneyActionDto, ProviderQueryDto, SimulateResultDto, TransactionsQueryDto } from './dto/common.dto';
import { PrismaService } from '../prisma/prisma.service';

type TransactionType = 'transfer_in' | 'transfer_out' | 'bet' | 'win' | 'result';

@Injectable()
export class MockProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviders(query: ProviderQueryDto) {
    const where: Prisma.GameProviderWhereInput = {};
    if (query.providerCode) where.code = query.providerCode;
    if (query.status) where.status = query.status;
    const providers = await this.prisma.gameProvider.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { games: true } } } });
    return this.ok(providers);
  }

  async getGames(query: GameQueryDto) {
    const where: Prisma.GameWhereInput = {};
    if (query.providerCode) where.providerCode = query.providerCode;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.q) where.OR = [{ name: { contains: query.q } }, { gameCode: { contains: query.q } }];
    const games = await this.prisma.game.findMany({ where, orderBy: [{ isHot: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }], include: { provider: true } });
    return this.ok(games);
  }

  async getGame(gameCode: string) {
    const game = await this.prisma.game.findUnique({ where: { gameCode }, include: { provider: true } });
    if (!game) throw new NotFoundException({ success: false, code: 'GAME_NOT_FOUND', message: 'Game not found' });
    return this.ok(game);
  }

  async launch(body: LaunchGameDto) {
    const game = await this.prisma.game.findUnique({ where: { gameCode: body.gameCode }, include: { provider: true } });
    if (!game || game.providerCode !== body.providerCode) throw new NotFoundException({ success: false, code: 'GAME_NOT_FOUND', message: 'Game not found for this provider' });
    if (game.status !== 'active' || game.provider.status !== 'active') throw new BadRequestException({ success: false, code: 'GAME_INACTIVE', message: 'Game or provider is inactive' });
    const sessionToken = `mock_${randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    const launchBaseUrl = process.env.MOCK_PROVIDER_LAUNCH_BASE_URL || 'http://localhost:4000/mock-game/play';
    const launchUrl = `${launchBaseUrl}?token=${encodeURIComponent(sessionToken)}&providerCode=${encodeURIComponent(body.providerCode)}&gameCode=${encodeURIComponent(body.gameCode)}&memberId=${encodeURIComponent(body.memberId)}`;
    await this.prisma.providerSession.create({ data: { memberId: body.memberId, providerCode: body.providerCode, gameCode: body.gameCode, sessionToken, launchUrl, expiresAt } });
    return this.ok({ launchUrl, sessionToken, expiresAt });
  }

  async transferIn(body: MoneyActionDto) { return this.createMoneyTransaction({ ...body, type: 'transfer_in', direction: 'credit', rawRequest: body }); }
  async transferOut(body: MoneyActionDto) { return this.createMoneyTransaction({ ...body, type: 'transfer_out', direction: 'debit', rawRequest: body }); }
  async simulateBet(body: MoneyActionDto) { return this.createMoneyTransaction({ ...body, type: 'bet', direction: 'debit', rawRequest: body }); }
  async simulateWin(body: MoneyActionDto) { return this.createMoneyTransaction({ ...body, type: 'win', direction: 'credit', rawRequest: body }); }

  async simulateResult(body: SimulateResultDto) {
    const existed = await this.prisma.providerTransaction.findUnique({ where: { referenceId: body.referenceId } });
    if (existed) return this.ok(this.toTransactionResponse(existed, true));
    return this.prisma.$transaction(async (tx) => {
      await this.ensureProviderActive(tx, body.providerCode);
      await this.ensureGameActive(tx, body.providerCode, body.gameCode);
      const wallet = await this.getOrCreateWallet(tx, body.memberId, body.providerCode);
      const beforeBalance = Number(wallet.balance);
      const afterBalance = beforeBalance - body.betAmount + body.winAmount;
      if (afterBalance < 0) throw new BadRequestException({ success: false, code: 'INSUFFICIENT_PROVIDER_BALANCE', message: 'Provider balance is not enough', data: { currentBalance: beforeBalance, requiredAmount: body.betAmount } });
      const updatedWallet = await tx.providerWallet.update({ where: { memberId_providerCode: { memberId: body.memberId, providerCode: body.providerCode } }, data: { balance: new Prisma.Decimal(afterBalance) } });
      const response = { providerBalance: Number(updatedWallet.balance), referenceId: body.referenceId, providerTransactionId: this.makeProviderTransactionId(body.providerCode, 'RESULT') };
      const transaction = await tx.providerTransaction.create({ data: { memberId: body.memberId, providerCode: body.providerCode, gameCode: body.gameCode, type: 'result', amount: new Prisma.Decimal(body.winAmount - body.betAmount), beforeBalance: new Prisma.Decimal(beforeBalance), afterBalance: updatedWallet.balance, referenceId: body.referenceId, providerTransactionId: response.providerTransactionId, status: 'success', rawRequest: JSON.stringify(body), rawResponse: JSON.stringify(response) } });
      return this.ok(this.toTransactionResponse(transaction, false));
    });
  }

  async getBalance(query: BalanceQueryDto) {
    const wallet = await this.prisma.providerWallet.findUnique({ where: { memberId_providerCode: { memberId: query.memberId, providerCode: query.providerCode } } });
    return this.ok({ memberId: query.memberId, providerCode: query.providerCode, balance: wallet ? Number(wallet.balance) : 0 });
  }

  async getTransactions(query: TransactionsQueryDto) {
    const where: Prisma.ProviderTransactionWhereInput = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.providerCode) where.providerCode = query.providerCode;
    if (query.type) where.type = query.type;
    const transactions = await this.prisma.providerTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(query.limit || 50, 200) });
    return this.ok(transactions.map((t) => this.toTransactionResponse(t, false)));
  }

  private async createMoneyTransaction(params: MoneyActionDto & { type: TransactionType; direction: 'credit' | 'debit'; rawRequest: unknown }) {
    const existed = await this.prisma.providerTransaction.findUnique({ where: { referenceId: params.referenceId } });
    if (existed) return this.ok(this.toTransactionResponse(existed, true));
    return this.prisma.$transaction(async (tx) => {
      await this.ensureProviderActive(tx, params.providerCode);
      if (params.gameCode) await this.ensureGameActive(tx, params.providerCode, params.gameCode);
      const wallet = await this.getOrCreateWallet(tx, params.memberId, params.providerCode);
      const beforeBalance = Number(wallet.balance);
      const afterBalance = params.direction === 'credit' ? beforeBalance + params.amount : beforeBalance - params.amount;
      if (afterBalance < 0) throw new BadRequestException({ success: false, code: 'INSUFFICIENT_PROVIDER_BALANCE', message: 'Provider balance is not enough', data: { currentBalance: beforeBalance, requiredAmount: params.amount } });
      const updatedWallet = await tx.providerWallet.update({ where: { memberId_providerCode: { memberId: params.memberId, providerCode: params.providerCode } }, data: { balance: new Prisma.Decimal(afterBalance) } });
      const response = { providerBalance: Number(updatedWallet.balance), referenceId: params.referenceId, providerTransactionId: this.makeProviderTransactionId(params.providerCode, params.type.toUpperCase()) };
      const transaction = await tx.providerTransaction.create({ data: { memberId: params.memberId, providerCode: params.providerCode, gameCode: params.gameCode, type: params.type, amount: new Prisma.Decimal(params.amount), beforeBalance: new Prisma.Decimal(beforeBalance), afterBalance: updatedWallet.balance, referenceId: params.referenceId, providerTransactionId: response.providerTransactionId, status: 'success', rawRequest: JSON.stringify(params.rawRequest), rawResponse: JSON.stringify(response) } });
      return this.ok(this.toTransactionResponse(transaction, false));
    });
  }

  private async ensureProviderActive(tx: Prisma.TransactionClient, providerCode: string) {
    const provider = await tx.gameProvider.findUnique({ where: { code: providerCode } });
    if (!provider) throw new NotFoundException({ success: false, code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' });
    if (provider.status !== 'active') throw new BadRequestException({ success: false, code: 'PROVIDER_INACTIVE', message: 'Provider is inactive' });
  }

  private async ensureGameActive(tx: Prisma.TransactionClient, providerCode: string, gameCode: string) {
    const game = await tx.game.findUnique({ where: { gameCode } });
    if (!game || game.providerCode !== providerCode) throw new NotFoundException({ success: false, code: 'GAME_NOT_FOUND', message: 'Game not found for this provider' });
    if (game.status !== 'active') throw new BadRequestException({ success: false, code: 'GAME_INACTIVE', message: 'Game is inactive' });
  }

  private async getOrCreateWallet(tx: Prisma.TransactionClient, memberId: string, providerCode: string) {
    return tx.providerWallet.upsert({ where: { memberId_providerCode: { memberId, providerCode } }, update: {}, create: { memberId, providerCode, balance: new Prisma.Decimal(0) } });
  }

  private makeProviderTransactionId(providerCode: string, type: string) { return `${providerCode}-${type}-${randomBytes(8).toString('hex').toUpperCase()}`; }

  private toTransactionResponse(transaction: ProviderTransaction, duplicated: boolean) {
    return { id: transaction.id, memberId: transaction.memberId, providerCode: transaction.providerCode, gameCode: transaction.gameCode, type: transaction.type, amount: Number(transaction.amount), beforeBalance: Number(transaction.beforeBalance), afterBalance: Number(transaction.afterBalance), referenceId: transaction.referenceId, providerTransactionId: transaction.providerTransactionId, status: transaction.status, duplicated, createdAt: transaction.createdAt };
  }

  private ok<T>(data: T) { return { success: true, data }; }
}
