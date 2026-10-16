import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SkrillService {
  private readonly logger = new Logger(SkrillService.name);

  constructor(private readonly configService: ConfigService) {}

  private getMerchantEmail(): string {
    return this.configService.get<string>('SKRILL_MERCHANT_EMAIL', '');
  }

  private getSecretWord(): string {
    return this.configService.get<string>('SKRILL_SECRET_WORD', '');
  }

  private getMerchantId(): string {
    return this.configService.get<string>('SKRILL_MERCHANT_ID', '');
  }

  private getCheckoutUrl(): string {
    return 'https://pay.skrill.com';
  }

  /**
   * Helper to filter out localhost / private URLs that Skrill CloudFront WAF blocks with 403
   */
  private sanitizeUrl(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Skrill's CloudFront firewall blocks any request containing 'localhost' or '127.0.0.1' in URL parameters.
      // Omit the parameter in local development so Skrill uses default redirection or doesn't reject the payload.
      return undefined;
    }
    return url;
  }

  /**
   * Creates a Skrill Quick Checkout session server-to-server and obtains a session ID (SID).
   */
  async prepareSession(params: {
    transactionId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    description?: string;
    returnUrl?: string;
    cancelUrl?: string;
    statusUrl?: string;
  }): Promise<{ sessionId?: string; redirectUrl: string; formFields: Record<string, string> }> {
    const merchantEmail = this.getMerchantEmail();
    if (!merchantEmail) {
      this.logger.warn('SKRILL_MERCHANT_EMAIL is not configured');
    }

    const defaultReturnUrl = this.configService.get<string>('FRONTEND_URL');
    const defaultCancelUrl = this.configService.get<string>('FRONTEND_URL');
    const backendUrl = this.configService.get<string>('BACKEND_URL');
    const defaultStatusUrl = backendUrl ? `${backendUrl}/api/v1/payments/skrill/ipn` : undefined;

    const returnUrl = this.sanitizeUrl(params.returnUrl || defaultReturnUrl);
    const cancelUrl = this.sanitizeUrl(params.cancelUrl || defaultCancelUrl);
    const statusUrl = this.sanitizeUrl(params.statusUrl || defaultStatusUrl);

    const formFields: Record<string, string> = {
      pay_to_email: merchantEmail,
      recipient_description: 'RS Gold & Services',
      transaction_id: params.transactionId,
      language: 'EN',
      pay_from_email: params.customerEmail,
      amount: params.amount.toFixed(2),
      currency: params.currency.toUpperCase(),
      detail1_description: 'Product',
      detail1_text: params.description || 'RuneScape Gold / Service',
    };

    if (returnUrl) formFields.return_url = returnUrl;
    if (cancelUrl) formFields.cancel_url = cancelUrl;
    if (statusUrl) formFields.status_url = statusUrl;

    // Try server-to-server preparation (prepare_only=1)
    try {
      const prepParams = new URLSearchParams({
        ...formFields,
        prepare_only: '1',
      });

      const response = await fetch(this.getCheckoutUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: prepParams.toString(),
      });

      const text = (await response.text()).trim();

      // Skrill returns a 32-character hexadecimal session ID upon success
      if (response.ok && /^[a-fA-F0-9]{32}$/.test(text)) {
        return {
          sessionId: text,
          redirectUrl: `https://pay.skrill.com/?sid=${text}`,
          formFields,
        };
      } else {
        this.logger.warn(`Skrill prepare_only returned non-SID response: ${text.slice(0, 150)}`);
      }
    } catch (error: any) {
      this.logger.error(`Error during Skrill server-to-server session prep: ${error.message}`);
    }

    // Fallback: direct form post without prepare_only
    return {
      redirectUrl: this.getCheckoutUrl(),
      formFields,
    };
  }

  /**
   * Generates parameters and checkout URL for Skrill Quick Checkout
   */
  generateCheckoutData(params: {
    transactionId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    description?: string;
    returnUrl?: string;
    cancelUrl?: string;
    statusUrl?: string;
  }) {
    const merchantEmail = this.getMerchantEmail();
    if (!merchantEmail) {
      this.logger.warn('SKRILL_MERCHANT_EMAIL is not configured');
    }

    const defaultReturnUrl = this.configService.get<string>('FRONTEND_URL');
    const defaultCancelUrl = this.configService.get<string>('FRONTEND_URL');
    const backendUrl = this.configService.get<string>('BACKEND_URL');
    const defaultStatusUrl = backendUrl ? `${backendUrl}/api/v1/payments/skrill/ipn` : undefined;

    const returnUrl = this.sanitizeUrl(params.returnUrl || defaultReturnUrl);
    const cancelUrl = this.sanitizeUrl(params.cancelUrl || defaultCancelUrl);
    const statusUrl = this.sanitizeUrl(params.statusUrl || defaultStatusUrl);

    const formFields: Record<string, string> = {
      pay_to_email: merchantEmail,
      recipient_description: 'RS Gold & Services',
      transaction_id: params.transactionId,
      language: 'EN',
      pay_from_email: params.customerEmail,
      amount: params.amount.toFixed(2),
      currency: params.currency.toUpperCase(),
      detail1_description: 'Product',
      detail1_text: params.description || 'RuneScape Gold / Service',
    };

    if (returnUrl) formFields.return_url = returnUrl;
    if (cancelUrl) formFields.cancel_url = cancelUrl;
    if (statusUrl) formFields.status_url = statusUrl;

    return {
      checkoutUrl: this.getCheckoutUrl(),
      formFields,
    };
  }

  /**
   * Validates Skrill Status/IPN MD5 signature
   * Formula: MD5(merchant_id + transaction_id + MD5(secret_word).toUpperCase() + mb_amount + mb_currency + status).toUpperCase()
   */
  verifyIpnSignature(payload: {
    merchant_id?: string;
    transaction_id: string;
    mb_amount: string;
    mb_currency: string;
    status: string;
    md5sig?: string;
  }): boolean {
    const secretWord = this.getSecretWord();
    if (!secretWord) {
      this.logger.warn(
        'SKRILL_SECRET_WORD is not set. Signature verification is in permissive mode.',
      );
      return true;
    }

    if (!payload.md5sig) {
      return false;
    }

    const merchantId = payload.merchant_id || this.getMerchantId();
    const secretWordHash = crypto
      .createHash('md5')
      .update(secretWord)
      .digest('hex')
      .toUpperCase();

    const stringToHash = `${merchantId}${payload.transaction_id}${secretWordHash}${payload.mb_amount}${payload.mb_currency}${payload.status}`;
    const calculatedSig = crypto
      .createHash('md5')
      .update(stringToHash)
      .digest('hex')
      .toUpperCase();

    const isValid =
      calculatedSig.toUpperCase() === payload.md5sig.toUpperCase();
    if (!isValid) {
      this.logger.error(
        `Skrill IPN signature mismatch. Calculated: ${calculatedSig}, Received: ${payload.md5sig}`,
      );
    }
    return isValid;
  }
}
