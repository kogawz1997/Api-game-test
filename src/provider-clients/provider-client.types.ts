export type ProviderWalletMode = 'transfer' | 'seamless' | 'external';

export interface ProviderRuntimeConfig {
  providerCode: string;
  apiBaseUrl: string;
  merchantId?: string | null;
  agentId?: string | null;
  apiKey?: string | null;
  secretKey?: string | null;
  webhookSecret?: string | null;
  ipWhitelist?: string[];
  callbackUrl?: string | null;
  walletMode: string;
  currency: string;
  language: string;
  status: string;
}

export interface ProviderRequestPayload {
  memberId?: string;
  providerCode: string;
  gameCode?: string;
  amount?: number;
  referenceId?: string;
  [key: string]: unknown;
}

export interface ProviderClientResponse<T = unknown> {
  success: boolean;
  providerCode: string;
  external: boolean;
  action: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ProviderClient {
  testConnection(config: ProviderRuntimeConfig): Promise<ProviderClientResponse>;
  launch(config: ProviderRuntimeConfig, payload: ProviderRequestPayload): Promise<ProviderClientResponse>;
  transferIn(config: ProviderRuntimeConfig, payload: ProviderRequestPayload): Promise<ProviderClientResponse>;
  transferOut(config: ProviderRuntimeConfig, payload: ProviderRequestPayload): Promise<ProviderClientResponse>;
  getBalance(config: ProviderRuntimeConfig, payload: ProviderRequestPayload): Promise<ProviderClientResponse>;
}
