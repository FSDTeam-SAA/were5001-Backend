import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

export enum ChatSenderType {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export enum ChatMessageType {
  TEXT = 'text',
  ORDER_PREFILL = 'order_prefill',
  IMAGE = 'image',
  SYSTEM = 'system',
}

@Schema({ collection: 'chat_messages', timestamps: true })
export class ChatMessage {
  @Prop({
    type: Types.ObjectId,
    ref: 'ChatConversation',
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({ required: true, index: true, trim: true })
  roomId: string;

  @Prop({
    required: true,
    enum: ChatSenderType,
    default: ChatSenderType.CUSTOMER,
    index: true,
  })
  senderType: ChatSenderType;

  @Prop({ required: false, trim: true })
  senderId?: string;

  @Prop({ required: true, trim: true, default: 'Customer' })
  senderName: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({
    required: true,
    enum: ChatMessageType,
    default: ChatMessageType.TEXT,
  })
  messageType: ChatMessageType;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
