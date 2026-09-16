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
  ChatSenderType,
  ChatMessageType,
} from '../schemas/chat-message.schema';
import { ConversationStatus } from '../schemas/chat-conversation.schema';

// ─── Initialize Conversation DTO ─────────────────────────────────────────────
export class InitConversationDto {
  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  guestId?: string;

  @IsString()
  @IsOptional()
  customerName?: string = 'Guest Visitor';

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsObject()
  @IsOptional()
  orderContext?: Record<string, any>;
}

// ─── Pre-fill Order DTO ───────────────────────────────────────────────────────
export class PrefillOrderDto {
  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  guestId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsNotEmpty()
  actionType:
    | 'buy_gold'
    | 'sell_gold'
    | 'buy_item'
    | 'sell_item'
    | 'buy_account'
    | 'powerleveling'
    | 'service';

  @IsString()
  @IsOptional()
  game?: 'osrs' | 'rs3' = 'osrs';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quantityM?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  gameCharacterName?: string;

  @IsString()
  @IsOptional()
  itemName?: string;

  @IsString()
  @IsOptional()
  itemId?: string;

  @IsString()
  @IsOptional()
  accountTitle?: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  serviceName?: string;

  @IsString()
  @IsOptional()
  skillDetails?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Send Message DTO ────────────────────────────────────────────────────────
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(ChatSenderType)
  @IsOptional()
  senderType?: ChatSenderType = ChatSenderType.CUSTOMER;

  @IsString()
  @IsOptional()
  senderName?: string = 'Customer';

  @IsEnum(ChatMessageType)
  @IsOptional()
  messageType?: ChatMessageType = ChatMessageType.TEXT;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// ─── Query Conversation DTO ──────────────────────────────────────────────────
export class QueryConversationDto {
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

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
  limit?: number = 15;
}

// ─── Query Messages DTO ──────────────────────────────────────────────────────
export class QueryMessageDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
