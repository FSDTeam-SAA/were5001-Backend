import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  expiry?: string | Date;
}

export class UpdateSessionDto {
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  expiry?: string | Date;
}
