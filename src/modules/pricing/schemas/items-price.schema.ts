import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ItemsPriceDocument = HydratedDocument<ItemsPrice>;

@Schema({ collection: 'items_price', timestamps: true })
export class ItemsPrice {
  @Prop({ required: true, type: Number, default: 1.8 })
  osrs: number;

  @Prop({ required: true, type: Number, default: 20.0 })
  rs3: number;
}

export const ItemsPriceSchema = SchemaFactory.createForClass(ItemsPrice);
