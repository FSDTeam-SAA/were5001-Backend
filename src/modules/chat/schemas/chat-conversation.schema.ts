import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatConversationDocument = HydratedDocument<ChatConversation>;

export enum ConversationStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Schema({ collection: 'chat_conversations', timestamps: true })
export class ChatConversation {
  @Prop({ required: true, unique: true, index: true, trim: true })
  roomId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: false, trim: true, index: true })
  guestId?: string;

  @Prop({ required: true, trim: true, default: 'Guest Visitor' })
  customerName: string;

  @Prop({ required: false, trim: true, lowercase: true, index: true })
  customerEmail?: string;

  @Prop({
    required: true,
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
    index: true,
  })
  status: ConversationStatus;

  @Prop({ type: Object, default: null })
  orderContext?: {
    actionType: string;
    game?: string;
    quantityM?: number;
    gameCharacterName?: string;
    itemName?: string;
    accountId?: string;
    serviceName?: string;
    totalPrice?: number;
    currency?: string;
    paymentMethod?: string;
    formattedSummary?: string;
    [key: string]: any;
  };

  @Prop({ type: Object, default: null })
  lastMessage?: {
    content: string;
    senderType: string;
    senderName: string;
    timestamp: Date;
  };

  @Prop({ type: Number, default: 0 })
  unreadAdminCount: number;

  @Prop({ type: Number, default: 0 })
  unreadCustomerCount: number;
}

export const ChatConversationSchema =
  SchemaFactory.createForClass(ChatConversation);
