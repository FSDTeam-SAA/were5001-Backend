import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ValuteDocument = HydratedDocument<Valute>;

@Schema({ collection: 'valutes_db', timestamps: true })
export class Valute {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    maxlength: 30,
  })
  real_id: string;

  @Prop({ required: true, trim: true, maxlength: 30 })
  name: string;

  @Prop({ required: true, unique: true, trim: true, maxlength: 60 })
  image: string;

  @Prop({ required: true, type: Number, default: 0.0 })
  osrs_buy: number;

  @Prop({ required: true, type: Number, default: 0.0 })
  osrs_sell: number;

  @Prop({ required: true, type: Number, default: 0.0 })
  rs3_buy: number;

  @Prop({ required: true, type: Number, default: 0.0 })
  rs3_sell: number;

  @Prop({ required: true, type: Boolean, default: false })
  paytriot: boolean;

  @Prop({ required: true, type: Boolean, default: false })
  login_required: boolean;

  @Prop({ required: true, type: Number, default: 0.0 })
  buy_limit_min: number;

  @Prop({ required: true, type: Number, default: 10000.0 })
  buy_limit_max: number;

  @Prop({ required: true, type: Number, default: 0.0 })
  sell_limit_min: number;

  @Prop({ required: true, type: Number, default: 10000.0 })
  sell_limit_max: number;
}

export const ValuteSchema = SchemaFactory.createForClass(Valute);
