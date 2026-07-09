import { Module } from '@nestjs/common';
import { ProviderClientFactory } from '../provider-clients/provider-client.factory';
import { AdvancedGameService } from './advanced-game.service';
import { MockProviderController } from './mock-provider.controller';
import { MockProviderService } from './mock-provider.service';
import { MockProviderHmacGuard } from './security/mock-provider-hmac.guard';
import { StaticPagesController } from './static-pages.controller';

@Module({
  controllers: [MockProviderController, StaticPagesController],
  providers: [MockProviderService, AdvancedGameService, MockProviderHmacGuard, ProviderClientFactory],
})
export class MockProviderModule {}
