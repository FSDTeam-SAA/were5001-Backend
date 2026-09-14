import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentGatewayDocument = HydratedDocument<PaymentGateway>;

@Schema({ collection: 'payments_db', timestamps: true })
export class PaymentGateway {
  @Prop({ type: Types.ObjectId, ref: 'Valute', required: false, index: true })
  valuteId?: Types.ObjectId;

  @Prop({ type: Object, default: () => ({}) })
  osrs_buy: Record<string, any>;

  @Prop({ type: Object, default: () => ({}) })
  osrs_sell: Record<string, any>;

  @Prop({ type: Object, default: () => ({}) })
  rs3_buy: Record<string, any>;

  @Prop({ type: Object, default: () => ({}) })
  rs3_sell: Record<string, any>;
}

export const PaymentGatewaySchema =
  SchemaFactory.createForClass(PaymentGateway);
