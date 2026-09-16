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

    const defaultReturnUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000/payment/success';
    const defaultCancelUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000/payment/cancel';
    const backendUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:5000';
    const defaultStatusUrl = `${backendUrl}/payments/skrill/ipn`;

    const formFields = {
      pay_to_email: merchantEmail,
      recipient_description: 'RS Gold & Services',
      transaction_id: params.transactionId,
      return_url: params.returnUrl || defaultReturnUrl,
      cancel_url: params.cancelUrl || defaultCancelUrl,
      status_url: params.statusUrl || defaultStatusUrl,
      language: 'EN',
      pay_from_email: params.customerEmail,
      amount: params.amount.toFixed(2),
      currency: params.currency.toUpperCase(),
      detail1_description: 'Product',
      detail1_text: params.description || 'RuneScape Gold / Service',
      prepare_only: '1',
    };

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
