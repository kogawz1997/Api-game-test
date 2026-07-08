import { Module } from '@nestjs/common';
import { MockProviderController } from './mock-provider.controller';
import { MockProviderService } from './mock-provider.service';
import { MockProviderHmacGuard } from './security/mock-provider-hmac.guard';

@Module({ controllers: [MockProviderController], providers: [MockProviderService, MockProviderHmacGuard] })
export class MockProviderModule {}
