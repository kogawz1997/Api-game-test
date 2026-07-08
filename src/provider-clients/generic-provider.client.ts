import { createHmac, randomBytes } from 'crypto';
import { ProviderClient, ProviderClientResponse, ProviderRequestPayload, ProviderRuntimeConfig } from './provider-client.types';

export class GenericProviderClient implements ProviderClient {
  constructor(private readonly providerCode: string) {}

  testConnection(config: ProviderRuntimeConfig) {
    return this.callProvider(config, 'ping', { providerCode: config.providerCode });
  }

  launch(config: ProviderRuntimeConfig, payload: ProviderRequestPayload) {
    return this.callProvider(config, 'launch', payload);
  }

  transferIn(config: ProviderRuntimeConfig, payload: ProviderRequestPayload) {
    return this.callProvider(config, 'transfer_in', payload);
  }

  transferOut(config: ProviderRuntimeConfig, payload: ProviderRequestPayload) {
    return this.callProvider(config, 'transfer_out', payload);
  }

  getBalance(config: ProviderRuntimeConfig, payload: ProviderRequestPayload) {
    return this.callProvider(config, 'balance', payload);
  }

  private async callProvider(config: ProviderRuntimeConfig, action: string, payload: ProviderRequestPayload): Promise<ProviderClientResponse> {
    if (!config.apiBaseUrl) {
      return this.fail(action, 'MISSING_API_BASE_URL', 'Provider apiBaseUrl is required');
    }

    if (!config.apiKey || !config.secretKey) {
      return this.fail(action, 'MISSING_CREDENTIALS', 'Provider apiKey and secretKey are required');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(12).toString('hex');
    const body = {
      action,
      providerCode: config.providerCode,
      merchantId: config.merchantId || undefined,
      agentId: config.agentId || undefined,
      currency: config.currency || 'THB',
      language: config.language || 'th',
      callbackUrl: config.callbackUrl || undefined,
      ...payload,
    };

    const rawBody = JSON.stringify(body);
    const signature = createHmac('sha256', config.secretKey)
      .update(`${timestamp}.${nonce}.${rawBody}`)
      .digest('hex');

    try {
      const response = await fetch(config.apiBaseUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-provider-code': config.providerCode,
          'x-api-key': config.apiKey,
          'x-merchant-id': config.merchantId || '',
          'x-agent-id': config.agentId || '',
          'x-timestamp': timestamp,
          'x-nonce': nonce,
          'x-signature': signature,
        },
        body: rawBody,
      });

      const text = await response.text();
      let data: unknown = text;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        return this.fail(action, `HTTP_${response.status}`, 'Provider returned non-success status', data);
      }

      return {
        success: true,
        providerCode: this.providerCode,
        external: true,
        action,
        data,
      };
    } catch (error) {
      return this.fail(action, 'PROVIDER_REQUEST_FAILED', error instanceof Error ? error.message : 'Provider request failed');
    }
  }

  private fail(action: string, code: string, message: string, details?: unknown): ProviderClientResponse {
    return {
      success: false,
      providerCode: this.providerCode,
      external: true,
      action,
      error: { code, message, details },
    };
  }
}
