import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Valute DTOs ─────────────────────────────────────────────────────────────
export class CreateValuteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  real_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  image: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  osrs_buy?: number = 0.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  osrs_sell?: number = 0.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rs3_buy?: number = 0.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rs3_sell?: number = 0.0;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  paytriot?: boolean = false;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  login_required?: boolean = false;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  buy_limit_min?: number = 0.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  buy_limit_max?: number = 10000.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sell_limit_min?: number = 0.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sell_limit_max?: number = 10000.0;
}

export class UpdateValuteDto {
  @IsString()
  @IsOptional()
  @MaxLength(30)
  real_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  image?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  osrs_buy?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  osrs_sell?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rs3_buy?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rs3_sell?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  paytriot?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  login_required?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  buy_limit_min?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  buy_limit_max?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sell_limit_min?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sell_limit_max?: number;
}

export class QueryValuteDto {
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

// ─── Items Price (Base Price) DTOs ───────────────────────────────────────────
export class UpdateBasePriceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  osrs?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rs3?: number;
}

// ─── Payment Gateway Config DTOs ─────────────────────────────────────────────
export class CreatePaymentGatewayDto {
  @IsString()
  @IsOptional()
  valuteId?: string;

  @IsObject()
  @IsOptional()
  osrs_buy?: Record<string, any> = {};

  @IsObject()
  @IsOptional()
  osrs_sell?: Record<string, any> = {};

  @IsObject()
  @IsOptional()
  rs3_buy?: Record<string, any> = {};

  @IsObject()
  @IsOptional()
  rs3_sell?: Record<string, any> = {};
}

export class UpdatePaymentGatewayDto {
  @IsString()
  @IsOptional()
  valuteId?: string;

  @IsObject()
  @IsOptional()
  osrs_buy?: Record<string, any>;

  @IsObject()
  @IsOptional()
  osrs_sell?: Record<string, any>;

  @IsObject()
  @IsOptional()
  rs3_buy?: Record<string, any>;

  @IsObject()
  @IsOptional()
  rs3_sell?: Record<string, any>;
}
