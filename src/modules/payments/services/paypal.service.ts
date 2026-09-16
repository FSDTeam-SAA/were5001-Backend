import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
  message?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
      }>;
    };
  }>;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {}

  private getBaseUrl(): string {
    const env = this.configService.get<string>('PAYPAL_ENVIRONMENT', 'sandbox');
    return env === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private getClientId(): string {
    return this.configService.get<string>('PAYPAL_CLIENT_ID', '');
  }

  private getClientSecret(): string {
    return this.configService.get<string>('PAYPAL_CLIENT_SECRET', '');
  }

  /**
   * Retrieves or refreshes OAuth2 token from PayPal
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt > now + 60000) {
      return this.accessToken;
    }

    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'PayPal credentials are not properly configured in environment variables',
      );
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = `${this.getBaseUrl()}/v1/oauth2/token`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`PayPal auth error: ${errorText}`);
        throw new BadRequestException('Failed to authenticate with PayPal');
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };
      this.accessToken = data.access_token;
      this.tokenExpiresAt = now + data.expires_in * 1000;
      return this.accessToken;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`PayPal getAccessToken exception: ${errorMsg}`);
      throw new BadRequestException(
        errorMsg || 'PayPal authentication failed',
      );
    }
  }

  /**
   * Creates an order in PayPal Orders v2 API
   */
  async createOrder(params: {
    amount: number;
    currency: string;
    customId: string;
    description?: string;
    returnUrl?: string;
    cancelUrl?: string;
  }) {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/v2/checkout/orders`;

    const defaultReturnUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000/payment/success';
    const defaultCancelUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000/payment/cancel';

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.customId,
          custom_id: params.customId,
          description: params.description || 'RuneScape Service Order',
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'RS Gold & Services',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl || defaultReturnUrl,
        cancel_url: params.cancelUrl || defaultCancelUrl,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as PayPalOrderResponse;
    if (!response.ok) {
      this.logger.error(`PayPal createOrder error: ${JSON.stringify(data)}`);
      throw new BadRequestException(
        data.message || 'Failed to create PayPal order',
      );
    }

    const approveLink = data.links?.find((l: PayPalLink) => l.rel === 'approve')?.href;

    return {
      orderId: data.id,
      status: data.status,
      approveUrl: approveLink,
      raw: data,
    };
  }

  /**
   * Captures an authorized PayPal order
   */
  async captureOrder(orderId: string) {
    const token = await this.getAccessToken();
    const url = `${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as PayPalOrderResponse;
    if (!response.ok) {
      this.logger.error(`PayPal captureOrder error: ${JSON.stringify(data)}`);
      throw new BadRequestException(
        data.message || 'Failed to capture PayPal order',
      );
    }

    const capture =
      data.purchase_units?.[0]?.payments?.captures?.[0] || undefined;

    return {
      orderId: data.id,
      status: data.status,
      captureId: capture?.id,
      captureStatus: capture?.status,
      raw: data,
    };
  }

  /**
   * Verifies PayPal Webhook Signature
   */
  async verifyWebhookSignature(params: {
    headers: Record<string, string>;
    body: Record<string, any>;
  }): Promise<boolean> {
    const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
    if (!webhookId) {
      this.logger.warn(
        'PAYPAL_WEBHOOK_ID is not configured, skipping signature verification',
      );
      return true;
    }

    try {
      const token = await this.getAccessToken();
      const url = `${this.getBaseUrl()}/v1/notifications/verify-webhook-signature`;

      const payload = {
        auth_algo: params.headers['paypal-auth-algo'],
        cert_url: params.headers['paypal-cert-url'],
        transmission_id: params.headers['paypal-transmission-id'],
        transmission_sig: params.headers['paypal-transmission-sig'],
        transmission_time: params.headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: params.body,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return false;
      const data = (await response.json()) as {
        verification_status: string;
      };
      return data.verification_status === 'SUCCESS';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`PayPal webhook verification failed: ${errorMsg}`);
      return false;
    }
  }
}
