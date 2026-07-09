import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AnyBody = Record<string, any>;

@Injectable()
export class AdvancedGameService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlayer(body: AnyBody) {
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    const memberId = this.requireString(body.memberId, 'memberId');
    const username = String(body.username || `${providerCode}_${memberId}`).toLowerCase();
    await this.ensureProvider(providerCode);
    const player = await this.prisma.providerPlayer.upsert({
      where: { providerCode_memberId: { providerCode, memberId } },
      update: { username, displayName: body.displayName ? String(body.displayName) : undefined, currency: String(body.currency || 'THB'), language: String(body.language || 'th'), status: String(body.status || 'active'), rawData: JSON.stringify(this.maskSecrets(body)) },
      create: { providerCode, memberId, username, displayName: body.displayName ? String(body.displayName) : null, currency: String(body.currency || 'THB'), language: String(body.language || 'th'), status: String(body.status || 'active'), rawData: JSON.stringify(this.maskSecrets(body)) },
    });
    await this.logApi(providerCode, 'create_player', body, { playerId: player.id }, 'success');
    return this.ok(player);
  }

  async getPlayer(body: AnyBody) {
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    const memberId = this.requireString(body.memberId, 'memberId');
    const player = await this.prisma.providerPlayer.findUnique({ where: { providerCode_memberId: { providerCode, memberId } } });
    if (!player) throw new NotFoundException({ success: false, code: 'PLAYER_NOT_FOUND', message: 'Provider player not found' });
    return this.ok(player);
  }

  async disablePlayer(body: AnyBody) {
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    const memberId = this.requireString(body.memberId, 'memberId');
    const player = await this.prisma.providerPlayer.update({ where: { providerCode_memberId: { providerCode, memberId } }, data: { status: 'disabled' } });
    await this.logApi(providerCode, 'disable_player', body, { playerId: player.id }, 'success');
    return this.ok(player);
  }

  async callbackBet(body: AnyBody) { return this.moneyCallback(body, 'callback_bet', 'bet', 'debit'); }
  async callbackWin(body: AnyBody) { return this.moneyCallback(body, 'callback_win', 'win', 'credit'); }

  async callbackSettle(body: AnyBody) {
    const startedAt = Date.now();
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    await this.protectCallback(providerCode, 'callback_settle', body);
    const memberId = this.requireString(body.memberId, 'memberId');
    const gameCode = this.requireString(body.gameCode, 'gameCode');
    const roundId = this.requireString(body.roundId, 'roundId');
    const betAmount = Number(body.betAmount || 0);
    const winAmount = Number(body.winAmount || 0);
    const validBetAmount = Number(body.validBetAmount ?? betAmount);
    const round = await this.prisma.gameRound.upsert({
      where: { providerCode_roundId: { providerCode, roundId } },
      update: { memberId, gameCode, betAmount: new Prisma.Decimal(betAmount), winAmount: new Prisma.Decimal(winAmount), validBetAmount: new Prisma.Decimal(validBetAmount), status: 'settled', settledAt: new Date(), rawData: JSON.stringify(this.maskSecrets(body)) },
      create: { providerCode, memberId, gameCode, roundId, betAmount: new Prisma.Decimal(betAmount), winAmount: new Prisma.Decimal(winAmount), validBetAmount: new Prisma.Decimal(validBetAmount), status: 'settled', settledAt: new Date(), rawData: JSON.stringify(this.maskSecrets(body)) },
    });
    await this.logApi(providerCode, 'callback_settle', body, { roundId: round.roundId }, 'success', startedAt);
    return this.ok(this.toRound(round));
  }

  async callbackCancel(body: AnyBody) { return this.updateRoundStatus(body, 'cancelled', 'callback_cancel'); }
  async callbackRollback(body: AnyBody) { return this.updateRoundStatus(body, 'rollback', 'callback_rollback'); }

  async getRound(body: AnyBody) {
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    const roundId = this.requireString(body.roundId, 'roundId');
    const round = await this.prisma.gameRound.findUnique({ where: { providerCode_roundId: { providerCode, roundId } } });
    if (!round) throw new NotFoundException({ success: false, code: 'ROUND_NOT_FOUND', message: 'Game round not found' });
    return this.ok(this.toRound(round));
  }

  async getRounds(body: AnyBody) {
    const where: Prisma.GameRoundWhereInput = {};
    if (body.providerCode) where.providerCode = String(body.providerCode).toUpperCase();
    if (body.memberId) where.memberId = String(body.memberId);
    if (body.gameCode) where.gameCode = String(body.gameCode);
    if (body.status) where.status = String(body.status);
    const rounds = await this.prisma.gameRound.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(Number(body.limit || 50), 200) });
    return this.ok(rounds.map((round) => this.toRound(round)));
  }

  async getProviderApiLogs(body: AnyBody) {
    const where: Prisma.ProviderApiLogWhereInput = {};
    if (body.providerCode) where.providerCode = String(body.providerCode).toUpperCase();
    if (body.actionName) where.action = String(body.actionName);
    if (body.status) where.status = String(body.status);
    const logs = await this.prisma.providerApiLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(Number(body.limit || 50), 200) });
    return this.ok(logs);
  }

  async reportSummary(body: AnyBody) {
    const providerCode = body.providerCode ? String(body.providerCode).toUpperCase() : undefined;
    const memberId = body.memberId ? String(body.memberId) : undefined;
    const txWhere: Prisma.ProviderTransactionWhereInput = {};
    if (providerCode) txWhere.providerCode = providerCode;
    if (memberId) txWhere.memberId = memberId;
    const roundWhere: Prisma.GameRoundWhereInput = {};
    if (providerCode) roundWhere.providerCode = providerCode;
    if (memberId) roundWhere.memberId = memberId;
    const walletWhere: Prisma.ProviderWalletWhereInput = {};
    if (providerCode) walletWhere.providerCode = providerCode;
    if (memberId) walletWhere.memberId = memberId;
    const [transactions, rounds, wallets] = await Promise.all([
      this.prisma.providerTransaction.findMany({ where: txWhere, take: 1000 }),
      this.prisma.gameRound.findMany({ where: roundWhere, take: 1000 }),
      this.prisma.providerWallet.findMany({ where: walletWhere }),
    ]);
    const totalBet = rounds.reduce((sum, round) => sum + Number(round.betAmount), 0);
    const totalWin = rounds.reduce((sum, round) => sum + Number(round.winAmount), 0);
    const walletBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);
    return this.ok({ filters: { providerCode, memberId }, totals: { transactionCount: transactions.length, roundCount: rounds.length, walletCount: wallets.length, walletBalance, totalBet, totalWin, netWinLoss: totalWin - totalBet } });
  }

  async reconcile(body: AnyBody) {
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    const memberId = this.requireString(body.memberId, 'memberId');
    const wallet = await this.prisma.providerWallet.findUnique({ where: { memberId_providerCode: { memberId, providerCode } } });
    const transactions = await this.prisma.providerTransaction.findMany({ where: { memberId, providerCode }, orderBy: { createdAt: 'asc' } });
    let expected = 0;
    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (['transfer_in', 'win'].includes(tx.type)) expected += amount;
      else if (['transfer_out', 'bet'].includes(tx.type)) expected -= amount;
      else if (tx.type === 'result') expected += amount;
    }
    const actual = wallet ? Number(wallet.balance) : 0;
    const diff = Number((actual - expected).toFixed(4));
    return this.ok({ providerCode, memberId, transactionCount: transactions.length, expectedBalance: Number(expected.toFixed(4)), actualBalance: actual, diff, status: Math.abs(diff) < 0.0001 ? 'matched' : 'mismatch' });
  }

  async cleanupCallbackNonces(body: AnyBody = {}) {
    const before = body.before ? new Date(String(body.before)) : new Date();
    const result = await this.prisma.callbackNonce.deleteMany({ where: { expiresAt: { lt: before } } });
    return this.ok({ deleted: result.count, before });
  }

  private async moneyCallback(body: AnyBody, actionName: string, txType: 'bet' | 'win', direction: 'debit' | 'credit') {
    const startedAt = Date.now();
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    await this.protectCallback(providerCode, actionName, body);
    const memberId = this.requireString(body.memberId, 'memberId');
    const gameCode = this.requireString(body.gameCode, 'gameCode');
    const roundId = this.requireString(body.roundId, 'roundId');
    const amount = Number(body.amount ?? body.betAmount ?? body.winAmount ?? 0);
    const referenceId = String(body.transactionId || body.referenceId || `${actionName}-${providerCode}-${roundId}`);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException({ success: false, code: 'INVALID_AMOUNT', message: 'amount must be greater than 0' });
    const existed = await this.prisma.providerTransaction.findUnique({ where: { referenceId } });
    if (existed) return this.ok({ duplicated: true, transaction: this.toTransaction(existed) });
    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.providerWallet.upsert({ where: { memberId_providerCode: { memberId, providerCode } }, update: {}, create: { memberId, providerCode, balance: new Prisma.Decimal(0) } });
      const beforeBalance = Number(wallet.balance);
      const afterBalance = direction === 'credit' ? beforeBalance + amount : beforeBalance - amount;
      if (afterBalance < 0) throw new BadRequestException({ success: false, code: 'INSUFFICIENT_BALANCE', message: 'Wallet balance is not enough', data: { beforeBalance, amount } });
      const updatedWallet = await tx.providerWallet.update({ where: { memberId_providerCode: { memberId, providerCode } }, data: { balance: new Prisma.Decimal(afterBalance) } });
      const round = await tx.gameRound.upsert({
        where: { providerCode_roundId: { providerCode, roundId } },
        update: { memberId, gameCode, betAmount: txType === 'bet' ? { increment: amount } : undefined, winAmount: txType === 'win' ? { increment: amount } : undefined, validBetAmount: txType === 'bet' ? { increment: amount } : undefined, status: txType === 'bet' ? 'open' : 'paid', rawData: JSON.stringify(this.maskSecrets(body)) },
        create: { providerCode, memberId, gameCode, roundId, betAmount: new Prisma.Decimal(txType === 'bet' ? amount : 0), winAmount: new Prisma.Decimal(txType === 'win' ? amount : 0), validBetAmount: new Prisma.Decimal(txType === 'bet' ? amount : 0), status: txType === 'bet' ? 'open' : 'paid', rawData: JSON.stringify(this.maskSecrets(body)) },
      });
      const transaction = await tx.providerTransaction.create({ data: { memberId, providerCode, gameCode, type: txType, amount: new Prisma.Decimal(amount), beforeBalance: new Prisma.Decimal(beforeBalance), afterBalance: updatedWallet.balance, referenceId, providerTransactionId: referenceId, status: 'success', rawRequest: JSON.stringify(this.maskSecrets(body)), rawResponse: JSON.stringify({ afterBalance }) } });
      return { round, transaction, balance: Number(updatedWallet.balance) };
    });
    await this.logApi(providerCode, actionName, body, result, 'success', startedAt);
    return this.ok({ ...result, transaction: this.toTransaction(result.transaction), round: this.toRound(result.round) });
  }

  private async updateRoundStatus(body: AnyBody, status: string, actionName: string) {
    const providerCode = this.requireString(body.providerCode, 'providerCode').toUpperCase();
    await this.protectCallback(providerCode, actionName, body);
    const roundId = this.requireString(body.roundId, 'roundId');
    const round = await this.prisma.gameRound.update({ where: { providerCode_roundId: { providerCode, roundId } }, data: { status, rawData: JSON.stringify(this.maskSecrets(body)), settledAt: ['cancelled', 'rollback'].includes(status) ? new Date() : undefined } });
    await this.logApi(providerCode, actionName, body, { roundId, status }, 'success');
    return this.ok(this.toRound(round));
  }

  private async protectCallback(providerCode: string, actionName: string, body: AnyBody) {
    if (!actionName.startsWith('callback_')) return;
    if (process.env.MOCK_CALLBACK_REQUIRE_IP_WHITELIST === 'true') {
      const config = await this.prisma.providerConfig.findUnique({ where: { providerCode } });
      const allowedIps = this.parseIpWhitelist(config?.ipWhitelist);
      const clientIp = this.normalizeIp(String(body.__clientIp || body.clientIp || ''));
      if (!clientIp || allowedIps.length === 0 || !allowedIps.map((ip) => this.normalizeIp(ip)).includes(clientIp)) throw new UnauthorizedException({ success: false, code: 'IP_NOT_WHITELISTED', message: 'Callback IP is not whitelisted', data: { clientIp, allowedIps } });
    }
    if (process.env.MOCK_CALLBACK_REQUIRE_NONCE === 'true') {
      const headers = body.__headers || {};
      const nonce = String(body.nonce || headers['x-nonce'] || '').trim();
      if (!nonce) throw new UnauthorizedException({ success: false, code: 'MISSING_NONCE', message: 'Callback nonce is required' });
      const ttlSeconds = Number(process.env.MOCK_CALLBACK_NONCE_TTL_SECONDS || 600);
      try { await this.prisma.callbackNonce.create({ data: { providerCode, nonce, action: actionName, expiresAt: new Date(Date.now() + ttlSeconds * 1000) } }); }
      catch (error: any) { if (error?.code === 'P2002') throw new UnauthorizedException({ success: false, code: 'REPLAY_DETECTED', message: 'Duplicate callback nonce rejected' }); throw error; }
    }
  }

  private parseIpWhitelist(value?: string | null) { if (!value) return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : [String(value)]; } catch { return value.split(',').map((item) => item.trim()).filter(Boolean); } }
  private normalizeIp(value: string) { const first = value.split(',')[0]?.trim() || ''; return first.replace('::ffff:', ''); }
  private async ensureProvider(providerCode: string) { const provider = await this.prisma.gameProvider.findUnique({ where: { code: providerCode } }); if (!provider) throw new NotFoundException({ success: false, code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' }); return provider; }
  private async logApi(providerCode: string, action: string, request: unknown, response: unknown, status: string, startedAt = Date.now(), errorCode?: string) { await this.prisma.providerApiLog.create({ data: { providerCode, action, direction: action.startsWith('callback') ? 'inbound' : 'internal', requestMasked: JSON.stringify(this.maskSecrets(request)), responseMasked: JSON.stringify(this.maskSecrets(response)), status, durationMs: Date.now() - startedAt, errorCode } }); }
  private requireString(value: unknown, field: string) { if (!value || typeof value !== 'string') throw new BadRequestException({ success: false, code: `MISSING_${field.toUpperCase()}`, message: `${field} is required` }); return value.trim(); }
  private maskSecrets(value: unknown): unknown { if (Array.isArray(value)) return value.map((item) => this.maskSecrets(item)); if (!value || typeof value !== 'object') return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, raw]) => { const lower = key.toLowerCase(); if (lower.includes('secret') || lower.includes('key') || lower.includes('token') || lower.includes('password') || lower.startsWith('__')) return [key, '***masked***']; return [key, this.maskSecrets(raw)]; })); }
  private toTransaction(tx: any) { return { ...tx, amount: Number(tx.amount), beforeBalance: Number(tx.beforeBalance), afterBalance: Number(tx.afterBalance) }; }
  private toRound(round: any) { return { ...round, betAmount: Number(round.betAmount), winAmount: Number(round.winAmount), validBetAmount: Number(round.validBetAmount) }; }
  private ok<T>(data: T) { return { success: true, data }; }
}
