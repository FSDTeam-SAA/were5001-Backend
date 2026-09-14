import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  item_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  image?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean = true;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  visible?: boolean = true;
}

export class UpdateItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(64)
  item_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  image?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  visible?: boolean;
}

export class CreateSkillingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  item_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  image?: string;

  @IsObject()
  @IsOptional()
  methods?: Record<string, any> = {};

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  visible?: boolean = true;
}

export class UpdateSkillingDto {
  @IsString()
  @IsOptional()
  @MaxLength(64)
  item_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  image?: string;

  @IsObject()
  @IsOptional()
  methods?: Record<string, any>;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  visible?: boolean;
}

export class UpdateSkillingMethodsDto {
  @IsObject()
  @IsNotEmpty()
  methods: Record<string, any>;
}

export class PatchStockDto {
  @Type(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  inStock: boolean;
}

export class PatchVisibilityDto {
  @Type(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  visible: boolean;
}

export class QueryCatalogDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  visible?: boolean;

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
