import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsEmail,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PaymentGatewayType,
  PaymentProductType,
  PaymentStatus,
} from '../schemas/payment-transaction.schema';

// ─── PayPal DTOs ─────────────────────────────────────────────────────────────
export class CreatePayPalOrderDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string = 'USD';

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsEnum(PaymentProductType)
  @IsOptional()
  productType: PaymentProductType = PaymentProductType.GOLD_OSRS;

  @IsObject()
  @IsOptional()
  productDetails?: Record<string, any>;

  @IsString()
  @IsOptional()
  returnUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

// ─── Skrill DTOs ─────────────────────────────────────────────────────────────
export class CreateSkrillPaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string = 'USD';

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsEnum(PaymentProductType)
  @IsOptional()
  productType: PaymentProductType = PaymentProductType.GOLD_OSRS;

  @IsObject()
  @IsOptional()
  productDetails?: Record<string, any>;

  @IsString()
  @IsOptional()
  returnUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

export class SkrillIpnDto {
  @IsString()
  @IsOptional()
  pay_to_email?: string;

  @IsString()
  @IsOptional()
  pay_from_email?: string;

  @IsString()
  @IsOptional()
  merchant_id?: string;

  @IsString()
  @IsOptional()
  customer_id?: string;

  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @IsString()
  @IsOptional()
  mb_transaction_id?: string;

  @IsString()
  @IsNotEmpty()
  mb_amount: string;

  @IsString()
  @IsNotEmpty()
  mb_currency: string;

  @IsString()
  @IsNotEmpty()
  status: string; // '2' = processed/complete, '0' = pending, '-1' = cancelled, '-2' = failed

  @IsString()
  @IsOptional()
  md5sig?: string;

  @IsString()
  @IsOptional()
  sha2sig?: string;

  @IsString()
  @IsOptional()
  amount?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}

// ─── Query Transaction DTO ───────────────────────────────────────────────────
export class QueryTransactionDto {
  @IsEnum(PaymentGatewayType)
  @IsOptional()
  gateway?: PaymentGatewayType;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
