import { GenericProviderClient } from '../generic-provider.client';

export class PgClient extends GenericProviderClient {
  constructor() {
    super('PG');
  }
}
