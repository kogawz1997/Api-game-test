import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProviderConfig, ProviderTransaction } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { BalanceQueryDto, GameQueryDto, LaunchGameDto, MoneyActionDto, ProviderQueryDto, SimulateResultDto, TransactionsQueryDto } from './dto/common.dto';
import { PrismaService } from '../prisma/prisma.service';

type TransactionType = 'transfer_in' | 'transfer_out' | 'bet' | 'win' | 'result';

@Injectable()
export class MockProviderService {
  constructor(private readonly prisma: PrismaService) {}

  getGatewayManifest() {
    return this.ok({
      gatewayUrl: '/api/game',
      method: 'POST',
      description: 'Single endpoint gateway. Send action with payload to call every mock game provider function.',
      credentialSettings: {
        description: 'Use these actions for the Credential settings page. Secret fields are stored encrypted-like and returned as masked only.',
        actions: ['provider_configs', 'provider_config', 'upsert_provider_config', 'test_provider_config']
      },
      actions: {
        providers: { body: { action: 'providers', status: 'active' } },
        games: { body: { action: 'games', providerCode: 'PG', category: 'slot', q: 'mahjong', status: 'active' } },
        game: { body: { action: 'game', gameCode: 'PG-MAHJONG-WAYS' } },
        launch: { body: { action: 'launch', memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS' } },
        transfer_in: { body: { action: 'transfer_in', memberId: 'member_001', providerCode: 'PG', amount: 500, referenceId: 'TX-IN-UNIQUE-ID' } },
        transfer_out: { body: { action: 'transfer_out', memberId: 'member_001', providerCode: 'PG', amount: 100, referenceId: 'TX-OUT-UNIQUE-ID' } },
        balance: { body: { action: 'balance', memberId: 'member_001', providerCode: 'PG' } },
        transactions: { body: { action: 'transactions', memberId: 'member_001', providerCode: 'PG', limit: 20 } },
        provider_configs: { body: { action: 'provider_configs' } },
        provider_config: { body: { action: 'provider_config', providerCode: 'PG' } },
        upsert_provider_config: { body: { action: 'upsert_provider_config', providerCode: 'PG', apiBaseUrl: 'https://mock-pg.provider.test/api', merchantId: 'merchant_001', agentId: 'agent_001', apiKey: 'api_key_here', secretKey: 'secret_key_here', webhookSecret: 'webhook_secret_here', ipWhitelist: ['127.0.0.1'], walletMode: 'transfer', currency: 'THB', language: 'th', status: 'active' } },
        test_provider_config: { body: { action: 'test_provider_config', providerCode: 'PG' } },
        simulate_bet: { body: { action: 'simulate_bet', memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', amount: 50, referenceId: 'BET-UNIQUE-ID' } },
        simulate_win: { body: { action: 'simulate_win', memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', amount: 120, referenceId: 'WIN-UNIQUE-ID' } },
        simulate_result: { body: { action: 'simulate_result', memberId: 'member_001', providerCode: 'PG', gameCode: 'PG-MAHJONG-WAYS', betAmount: 50, winAmount: 120, referenceId: 'RESULT-UNIQUE-ID' } }
      }
    });
  }

  async gateway(body: Record<string, any>) {
    const action = String(body?.action || '').trim().toLowerCase();
    if (!action) throw new BadRequestException({ success: false, code: 'MISSING_ACTION', message: 'Missing action in request body' });

    switch (action) {
      case 'providers':
      case 'get_providers': return this.getProviders(body as ProviderQueryDto);
      case 'games':
      case 'get_games': return this.getGames(body as GameQueryDto);
      case 'game':
      case 'get_game':
        if (!body.gameCode) throw new BadRequestException({ success: false, code: 'MISSING_GAME_CODE', message: 'gameCode is required' });
        return this.getGame(String(body.gameCode));
      case 'launch':
      case 'launch_game': return this.launch(body as LaunchGameDto);
      case 'transfer_in':
      case 'deposit_to_provider': return this.transferIn(body as MoneyActionDto);
      case 'transfer_out':
      case 'withdraw_from_provider': return this.transferOut(body as MoneyActionDto);
      case 'balance':
      case 'get_balance': return this.getBalance(body as BalanceQueryDto);
      case 'simulate_bet':
      case 'bet': return this.simulateBet(body as MoneyActionDto);
      case 'simulate_win':
      case 'win': return this.simulateWin(body as MoneyActionDto);
      case 'simulate_result':
      case 'result': return this.simulateResult(body as SimulateResultDto);
      case 'transactions':
      case 'get_transactions': return this.getTransactions(body as TransactionsQueryDto);
      case 'provider_configs':
      case 'configs': return this.getProviderConfigs();
      case 'provider_config':
      case 'config': return this.getProviderConfig(String(body.providerCode || ''));
      case 'upsert_provider_config':
      case 'save_provider_config': return this.upsertProviderConfig(body);
      case 'test_provider_config':
      case 'test_config': return this.testProviderConfig(String(body.providerCode || ''));
      default:
        throw new BadRequestException({ success: false, code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` });
    }
  }

  async getProviderConfigs() {
    const providers = await this.prisma.gameProvider.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    const configs = await this.prisma.providerConfig.findMany();
    const byProvider = new Map(configs.map((config) => [config.providerCode, config]));

    return this.ok(providers.map((provider) => this.toMaskedConfig(provider.code, provider.name, byProvider.get(provider.code))));
  }

  async getProviderConfig(providerCode: string) {
    if (!providerCode) throw new BadRequestException({ success: false, code: 'MISSING_PROVIDER_CODE', message: 'providerCode is required' });
    const provider = await this.prisma.gameProvider.findUnique({ where: { code: providerCode } });
    if (!provider) throw new NotFoundException({ success: false, code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' });
    const config = await this.prisma.providerConfig.findUnique({ where: { providerCode } });
    return this.ok(this.toMaskedConfig(provider.code, provider.name, config || undefined));
  }

  async upsertProviderConfig(body: Record<string, any>) {
    const providerCode = String(body.providerCode || '').trim().toUpperCase();
    if (!providerCode) throw new BadRequestException({ success: false, code: 'MISSING_PROVIDER_CODE', message: 'providerCode is required' });

    const provider = await this.prisma.gameProvider.findUnique({ where: { code: providerCode } });
    if (!provider) throw new NotFoundException({ success: false, code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' });

    const before = await this.prisma.providerConfig.findUnique({ where: { providerCode } });
    const data: Prisma.ProviderConfigUncheckedCreateInput = {
      providerCode,
      apiBaseUrl: String(body.apiBaseUrl || before?.apiBaseUrl || `https://mock-${providerCode.toLowerCase()}.provider.test/api`),
      merchantIdEnc: body.merchantId !== undefined ? this.encryptSecret(String(body.merchantId)) : before?.merchantIdEnc,
      agentIdEnc: body.agentId !== undefined ? this.encryptSecret(String(body.agentId)) : before?.agentIdEnc,
      apiKeyEnc: body.apiKey !== undefined ? this.encryptSecret(String(body.apiKey)) : before?.apiKeyEnc,
      secretKeyEnc: body.secretKey !== undefined ? this.encryptSecret(String(body.secretKey)) : before?.secretKeyEnc,
      webhookSecretEnc: body.webhookSecret !== undefined ? this.encryptSecret(String(body.webhookSecret)) : before?.webhookSecretEnc,
      ipWhitelist: Array.isArray(body.ipWhitelist) ? JSON.stringify(body.ipWhitelist) : body.ipWhitelist !== undefined ? String(body.ipWhitelist) : before?.ipWhitelist,
      callbackUrl: body.callbackUrl !== undefined ? String(body.callbackUrl) : before?.callbackUrl,
      walletMode: String(body.walletMode || before?.walletMode || 'transfer'),
      currency: String(body.currency || before?.currency || 'THB'),
      language: String(body.language || before?.language || 'th'),
      status: String(body.status || before?.status || 'active')
    };

    const config = await this.prisma.providerConfig.upsert({
      where: { providerCode },
      update: data,
      create: data
    });

    await this.prisma.providerConfigAudit.create({
      data: {
        providerCode,
        action: before ? 'update_provider_config' : 'create_provider_config',
        changedBy: body.changedBy ? String(body.changedBy) : 'system',
        maskedBefore: before ? JSON.stringify(this.toMaskedConfig(provider.code, provider.name, before)) : null,
        maskedAfter: JSON.stringify(this.toMaskedConfig(provider.code, provider.name, config))
      }
    });

    return this.ok(this.toMaskedConfig(provider.code, provider.name, config));
  }

  async testProviderConfig(providerCode: string) {
    if (!providerCode) throw new BadRequestException({ success: false, code: 'MISSING_PROVIDER_CODE', message: 'providerCode is required' });
    const provider = await this.prisma.gameProvider.findUnique({ where: { code: providerCode } });
    if (!provider) throw new NotFoundException({ success: false, code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' });

    const config = await this.prisma.providerConfig.findUnique({ where: { providerCode } });
    if (!config) throw new NotFoundException({ success: false, code: 'PROVIDER_CONFIG_NOT_FOUND', message: 'Provider config not found' });

    const missing = [] as string[];
    if (!config.apiBaseUrl) missing.push('apiBaseUrl');
    if (!config.apiKeyEnc) missing.push('apiKey');
    if (!config.secretKeyEnc) missing.push('secretKey');
    if (!config.merchantIdEnc && !config.agentIdEnc) missing.push('merchantIdOrAgentId');

    const status = missing.length === 0 ? 'ready' : 'missing_required_fields';
    const message = missing.length === 0 ? 'Provider config is ready for sandbox integration' : `Missing: ${missing.join(', ')}`;

    const updated = await this.prisma.providerConfig.update({
      where: { providerCode },
      data: { lastTestStatus: status, lastTestMessage: message, lastTestAt: new Date() }
    });

    return this.ok({ ...this.toMaskedConfig(provider.code, provider.name, updated), test: { status, message, missing } });
  }

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

  private toMaskedConfig(providerCode: string, providerName: string, config?: ProviderConfig) {
    return {
      providerCode,
      providerName,
      configured: Boolean(config),
      apiBaseUrl: config?.apiBaseUrl || null,
      apiBaseUrlMasked: this.maskPlain(config?.apiBaseUrl || ''),
      apiKeyMasked: this.maskEncrypted(config?.apiKeyEnc),
      secretKeyMasked: this.maskEncrypted(config?.secretKeyEnc),
      merchantIdMasked: this.maskEncrypted(config?.merchantIdEnc),
      agentIdMasked: this.maskEncrypted(config?.agentIdEnc),
      webhookSecretMasked: this.maskEncrypted(config?.webhookSecretEnc),
      ipWhitelist: this.parseIpWhitelist(config?.ipWhitelist),
      callbackUrl: config?.callbackUrl || null,
      walletMode: config?.walletMode || 'transfer',
      currency: config?.currency || 'THB',
      language: config?.language || 'th',
      status: config?.status || 'not_configured',
      lastTestStatus: config?.lastTestStatus || null,
      lastTestMessage: config?.lastTestMessage || null,
      lastTestAt: config?.lastTestAt || null,
      updatedAt: config?.updatedAt || null,
      secretSafe: true
    };
  }

  private parseIpWhitelist(value?: string | null) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [String(value)];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  private encryptSecret(value: string | undefined | null) {
    if (!value) return null;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.secretKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptSecret(value?: string | null) {
    if (!value) return '';
    if (!value.startsWith('v1:')) return value;
    try {
      const [, ivRaw, tagRaw, encryptedRaw] = value.split(':');
      const decipher = createDecipheriv('aes-256-gcm', this.secretKey(), Buffer.from(ivRaw, 'base64'));
      decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64')), decipher.final()]).toString('utf8');
    } catch {
      return '';
    }
  }

  private secretKey() {
    return createHash('sha256').update(process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.MOCK_PROVIDER_SECRET || 'dev-only-secret').digest();
  }

  private maskEncrypted(value?: string | null) {
    return this.maskPlain(this.decryptSecret(value));
  }

  private maskPlain(value: string) {
    if (!value) return null;
    if (value.length <= 4) return '****';
    return `${'*'.repeat(Math.min(12, value.length - 4))}${value.slice(-4)}`;
  }

  private ok<T>(data: T) { return { success: true, data }; }
}
