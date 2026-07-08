import { Module } from '@nestjs/common';
import { MockProviderModule } from './mock-provider/mock-provider.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({ imports: [PrismaModule, MockProviderModule] })
export class AppModule {}
