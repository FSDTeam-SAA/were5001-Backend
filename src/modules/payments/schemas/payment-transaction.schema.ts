import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

export enum PaymentGatewayType {
  PAYPAL = 'paypal',
  SKRILL = 'skrill',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentProductType {
  GOLD_OSRS = 'gold_osrs',
  GOLD_RS3 = 'gold_rs3',
  ACCOUNT = 'account',
  ITEM = 'item',
  SKILLING = 'skilling',
}

@Schema({ collection: 'payment_transactions', timestamps: true })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  customerEmail: string;

  @Prop({
    required: true,
    enum: PaymentGatewayType,
    index: true,
  })
  gateway: PaymentGatewayType;

  @Prop({ required: false, trim: true, index: true })
  gatewayOrderId?: string;

  @Prop({ required: false, trim: true, index: true })
  gatewayTransactionId?: string;

  @Prop({ required: true, type: Number, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true, uppercase: true, default: 'USD' })
  currency: string;

  @Prop({
    required: true,
    enum: PaymentProductType,
    default: PaymentProductType.GOLD_OSRS,
  })
  productType: PaymentProductType;

  @Prop({ type: Object, default: () => ({}) })
  productDetails: {
    gameCharacterName?: string;
    quantityM?: number;
    description?: string;
    itemId?: string;
    accountId?: string;
    [key: string]: any;
  };

  @Prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  @Prop({ type: Object, default: () => ({}) })
  gatewayRawResponse?: Record<string, any>;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);
