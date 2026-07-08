import { Injectable } from '@nestjs/common';
import { GenericProviderClient } from './generic-provider.client';
import { ProviderClient } from './provider-client.types';

@Injectable()
export class ProviderClientFactory {
  getClient(providerCode: string): ProviderClient {
    const code = providerCode.trim().toUpperCase();

    // ตอนนี้ใช้ generic client ที่ยิง single-endpoint provider format ได้ก่อน
    // ถ้าต่อค่ายจริง ให้แตก class เฉพาะเช่น PgClient, JiliClient, PpClient แล้ว map ตรงนี้
    return new GenericProviderClient(code);
  }
}
