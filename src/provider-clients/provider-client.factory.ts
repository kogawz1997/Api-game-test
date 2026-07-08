import { Injectable } from '@nestjs/common';
import { EvoClient } from './clients/evo.client';
import { JiliClient } from './clients/jili.client';
import { PgClient } from './clients/pg.client';
import { PpClient } from './clients/pp.client';
import { GenericProviderClient } from './generic-provider.client';
import { ProviderClient } from './provider-client.types';

@Injectable()
export class ProviderClientFactory {
  getClient(providerCode: string): ProviderClient {
    const code = providerCode.trim().toUpperCase();

    if (code === 'PG') return new PgClient();
    if (code === 'JILI') return new JiliClient();
    if (code === 'PP') return new PpClient();
    if (code === 'EVO') return new EvoClient();

    return new GenericProviderClient(code);
  }
}
