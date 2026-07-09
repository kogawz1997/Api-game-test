import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BalanceQueryDto, GameQueryDto, LaunchGameDto, MoneyActionDto, ProviderQueryDto, SimulateResultDto, TransactionsQueryDto } from './dto/common.dto';
import { MockProviderService } from './mock-provider.service';
import { MockProviderHmacGuard } from './security/mock-provider-hmac.guard';

@Controller()
export class MockProviderController {
  constructor(private readonly service: MockProviderService) {}

  @Get('health')
  health() {
    return { success: true, service: 'mock-game-provider-api', timestamp: new Date().toISOString() };
  }

  @Get('api/game')
  getGatewayManifest() {
    return this.service.getGatewayManifest();
  }

  @UseGuards(MockProviderHmacGuard)
  @Post('api/game')
  gateway(@Body() body: Record<string, any>, @Req() request: any) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || request.ip || request.socket?.remoteAddress || '';
    return this.service.gateway({ ...body, __clientIp: clientIp, __headers: request.headers || {} });
  }

  @Get('mock-provider/providers') getProviders(@Query() query: ProviderQueryDto) { return this.service.getProviders(query); }
  @Get('mock-provider/games') getGames(@Query() query: GameQueryDto) { return this.service.getGames(query); }
  @Get('mock-provider/games/:gameCode') getGame(@Param('gameCode') gameCode: string) { return this.service.getGame(gameCode); }
  @UseGuards(MockProviderHmacGuard) @Post('mock-provider/launch') launch(@Body() body: LaunchGameDto) { return this.service.launch(body); }
  @UseGuards(MockProviderHmacGuard) @Post('mock-provider/transfer-in') transferIn(@Body() body: MoneyActionDto) { return this.service.transferIn(body); }
  @UseGuards(MockProviderHmacGuard) @Post('mock-provider/transfer-out') transferOut(@Body() body: MoneyActionDto) { return this.service.transferOut(body); }
  @Get('mock-provider/balance') getBalance(@Query() query: BalanceQueryDto) { return this.service.getBalance(query); }
  @UseGuards(MockProviderHmacGuard) @Post('mock-provider/simulate-bet') simulateBet(@Body() body: MoneyActionDto) { return this.service.simulateBet(body); }
  @UseGuards(MockProviderHmacGuard) @Post('mock-provider/simulate-win') simulateWin(@Body() body: MoneyActionDto) { return this.service.simulateWin(body); }
  @UseGuards(MockProviderHmacGuard) @Post('mock-provider/simulate-result') simulateResult(@Body() body: SimulateResultDto) { return this.service.simulateResult(body); }
  @Get('mock-provider/transactions') getTransactions(@Query() query: TransactionsQueryDto) { return this.service.getTransactions(query); }
}
