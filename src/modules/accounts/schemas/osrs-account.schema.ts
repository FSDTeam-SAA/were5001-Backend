import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OsrsAccountDocument = HydratedDocument<OsrsAccount>;

@Schema({ collection: 'osrs_accounts_db', timestamps: true })
export class OsrsAccount {
  @Prop({ required: true, index: true, trim: true, maxlength: 30 })
  acc_id: string;

  @Prop({ required: true, trim: true, maxlength: 30 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 1024 })
  description: string;

  @Prop({ required: true, trim: true, maxlength: 256 })
  image: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: Number, default: 0 })
  stock: number;
}

export const OsrsAccountSchema = SchemaFactory.createForClass(OsrsAccount);
