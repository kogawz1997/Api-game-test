import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class MockProviderHmacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.MOCK_PROVIDER_REQUIRE_SIGNATURE !== 'true') return true;

    const request = context.switchToHttp().getRequest();
    const apiKey = request.header('x-api-key');
    const timestamp = request.header('x-timestamp');
    const nonce = request.header('x-nonce') || '';
    const signature = request.header('x-signature');
    const expectedApiKey = process.env.MOCK_PROVIDER_API_KEY || '';
    const secret = process.env.MOCK_PROVIDER_SECRET || '';

    if (!apiKey || !timestamp || !signature) {
      throw new UnauthorizedException({ success: false, code: 'MISSING_SIGNATURE_HEADERS', message: 'Missing signature headers' });
    }

    if (process.env.MOCK_PROVIDER_REQUIRE_NONCE === 'true' && !nonce) {
      throw new UnauthorizedException({ success: false, code: 'MISSING_NONCE', message: 'Missing x-nonce header' });
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException({ success: false, code: 'INVALID_API_KEY', message: 'Invalid API key' });
    }

    const now = Math.floor(Date.now() / 1000);
    const requestTimestamp = Number(timestamp);
    if (!Number.isFinite(requestTimestamp) || Math.abs(now - requestTimestamp) > 300) {
      throw new UnauthorizedException({ success: false, code: 'INVALID_TIMESTAMP', message: 'Invalid or expired timestamp' });
    }

    const rawBody = request.rawBody || JSON.stringify(request.body || {});
    const signatureBase = nonce ? `${timestamp}.${nonce}.${rawBody}` : `${timestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', secret).update(signatureBase).digest('hex');

    if (!this.safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException({ success: false, code: 'INVALID_SIGNATURE', message: 'Invalid API signature' });
    }

    return true;
  }

  private safeCompare(input: string, expected: string): boolean {
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
